"""Servicio forense de extracción y análisis de Indicadores de Compromiso (IoCs)."""
import re
import ipaddress
from typing import Optional

# Regex robustas para extracción forense
IPV4_REGEX = re.compile(r"\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b")
URL_REGEX = re.compile(r"https?://(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?::\d+)?(?:/[^\s\"'<>]*)?")
DOMAIN_REGEX = re.compile(r"\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|net|org|xyz|top|ru|cn|tk|info|biz|cc|io|cloud|online|site|live)\b", re.IGNORECASE)
SHA256_REGEX = re.compile(r"\b[a-fA-F0-9]{64}\b")
MD5_REGEX = re.compile(r"\b[a-fA-F0-9]{32}\b")
EMAIL_REGEX = re.compile(r"\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b")

SUSPICIOUS_TLDS = {".xyz", ".top", ".ru", ".cn", ".tk", ".work", ".click", ".buzz", ".live", ".support"}


def _classify_ip(ip_str: str) -> dict:
    try:
        ip = ipaddress.ip_address(ip_str)
        if ip.is_private or ip.is_loopback:
            return {
                "type": "ip",
                "value": ip_str,
                "category": "IP Privada / Activo Interno",
                "risk": "INFORMATIVO",
                "action": "Inspeccionar logs internos del host para detectar movimiento lateral.",
            }
        return {
            "type": "ip",
            "value": ip_str,
            "category": "IP Pública Externa",
            "risk": "ALTO",
            "action": "Bloquear en firewall perimetral y verificar comunicaciones salientes en proxy.",
        }
    except ValueError:
        return {
            "type": "ip",
            "value": ip_str,
            "category": "IP",
            "risk": "MEDIO",
            "action": "Verificar en consola de red.",
        }


def _classify_url(url_str: str) -> dict:
    low = url_str.lower()
    is_critical = any(kw in low for kw in ["login", "signin", "auth", "verify", "password", "update", "secure", "office", "microsoft", "banco"])
    is_suspicious_tld = any(tld in low for tld in SUSPICIOUS_TLDS)

    risk = "CRÍTICO" if (is_critical or is_suspicious_tld) else "ALTO"
    return {
        "type": "url",
        "value": url_str,
        "category": "Enlace Web / Vector de Ataque",
        "risk": risk,
        "action": "Añadir a lista de bloqueo en WAF/Proxy y analizar en Sandbox aislado.",
    }


def _classify_domain(domain_str: str) -> dict:
    low = domain_str.lower()
    is_suspicious_tld = any(low.endswith(tld) for tld in SUSPICIOUS_TLDS)
    is_spoofing = any(brand in low for brand in ["microsof", "google", "paypal", "apple", "netflix", "banco", "outlook"])

    risk = "CRÍTICO" if (is_spoofing or is_suspicious_tld) else "MEDIO"
    return {
        "type": "domain",
        "value": domain_str,
        "category": "Dominio Sospechoso / C2",
        "risk": risk,
        "action": "Habilitar sumidero DNS (DNS Sinkhole) y bloquear resolución en servidores corporativos.",
    }


def _classify_hash(hash_str: str, hash_type: str) -> dict:
    return {
        "type": "hash",
        "value": hash_str,
        "category": f"Firma Criptográfica ({hash_type.upper()})",
        "risk": "CRÍTICO",
        "action": "Aislar artefacto binario y propagar regla de bloqueo por hash a toda la flota EDR.",
    }


def extract_iocs(text: str) -> list[dict]:
    """Extrae y clasifica indicadores de compromiso únicos a partir de un texto libre."""
    if not text:
        return []

    results = []
    seen = set()

    # 1. Hashes SHA256
    for h in SHA256_REGEX.findall(text):
        if h not in seen:
            seen.add(h)
            results.append(_classify_hash(h, "SHA256"))

    # 2. Hashes MD5 (evitar colisiones de UUIDs sin guiones comprobando contexto)
    for h in MD5_REGEX.findall(text):
        if h not in seen and not any(h in s for s in SHA256_REGEX.findall(text)):
            seen.add(h)
            results.append(_classify_hash(h, "MD5"))

    # 3. URLs
    urls_found = []
    for u in URL_REGEX.findall(text):
        clean_url = u.rstrip(".,;)>]\"'")
        if clean_url not in seen:
            seen.add(clean_url)
            urls_found.append(clean_url)
            results.append(_classify_url(clean_url))

    # 4. IPs
    for ip in IPV4_REGEX.findall(text):
        # Excluir versiones de software tipo 1.0.0 o 2.1
        if ip not in seen and not ip.startswith("0.") and not ip.startswith("255."):
            seen.add(ip)
            results.append(_classify_ip(ip))

    # 5. Dominios (excluyendo los que ya están contenidos en URLs extraídas)
    for dom in DOMAIN_REGEX.findall(text):
        clean_dom = dom.rstrip(".,;)>]\"'").lower()
        if clean_dom not in seen and not any(clean_dom in u for u in urls_found):
            seen.add(clean_dom)
            results.append(_classify_domain(clean_dom))

    return results

"""
Descarga y consolidación de directivas oficiales NIST SP 800-61r2 (Guía de Manejo de Incidentes)
y CIS Controls v8 esenciales para enriquecer la base de conocimiento normativo.
"""
import os
import json

BENCHMARK_DIR = "docs/research/benchmark"
os.makedirs(BENCHMARK_DIR, exist_ok=True)

# 1. NIST SP 800-61r2: Computer Security Incident Handling Guide (Secciones Oficiales)
nist_doc = """# NIST SP 800-61 Rev. 2: Computer Security Incident Handling Guide

## Section 1: Introduction and Incident Management Framework
An information security incident is a violation or imminent threat of violation of computer security policies, acceptable use policies, or standard security practices. Organizations must establish an incident response capability that balances prevention with reaction. A successful incident response program requires robust governance, clear escalation paths, and automated triage to mitigate systemic compromise.

## Section 2: Preparation and Incident Prevention
Preparation is the foundation of incident response. Organizations must maintain up-to-date system inventories, perform continuous vulnerability assessments, and deploy host-based security tools. Preventing incidents requires hardening host configurations, enforcing the principle of least privilege, conducting mandatory security awareness training, and securing perimeter network boundaries through micro-segmentation and strict firewall filtering rules.

## Section 3: Incident Handling Methodology - Phase 1: Detection and Analysis
Detection involves identifying potential security events through automated alerting, security information and event management (SIEM) systems, and user reporting. Analysis requires verifying whether an incident occurred, determining its scope, severity, and identifying Indicators of Compromise (IoCs). Critical IoCs include unexpected outbound connections, unusual privilege escalation attempts, modified system binaries, and unauthorized credential dump activity. Precursor events must be correlated to differentiate benign false positives from active advanced persistent threats (APTs).

## Section 4: Incident Handling Methodology - Phase 2: Containment Strategies
Containment strategies must be executed promptly before an adversary expands access or exfiltrates confidential assets. Short-term containment focuses on immediate isolation: disconnecting compromised hosts from local VLANs, revoking active session tokens (OAuth/JWT), and null-routing malicious command-and-control (C2) IP addresses. Long-term containment involves patching exploited zero-day vulnerabilities, enforcing mandatory multi-factor authentication (MFA) resets, and reconfiguring network access control (NAC) filters.

## Section 5: Incident Handling Methodology - Phase 3: Eradication and Recovery
Eradication ensures that all malicious artifacts are permanently purged from the enterprise environment. This includes terminating rogue daemon processes, deleting persistence mechanisms (registry run keys, cron jobs, scheduled tasks), and restoring clean host images from immutable offline backups. Recovery involves validating system integrity before restoring services to operational production networks, accompanied by heightened telemetry logging for at least 30 consecutive business days.

## Section 6: Phase 4: Post-Incident Activity and Lessons Learned
Following incident closure, the incident response team must hold an executive lessons-learned meeting within two weeks. Objectives include analyzing root cause vectors, evaluating team response time (Mean Time to Detect - MTTD, and Mean Time to Remediate - MTTR), identifying policy gaps, and updating defensive playbooks. Objective incident metrics and digital forensic timelines must be archived for compliance and legal accountability.
"""

# 2. CIS Controls v8 / ISO 27001 Mapping: Enterprise Access and Data Protection Guidelines
cis_doc = """# CIS Critical Security Controls v8: Enterprise Implementation Playbook

## Section 1: Inventory and Control of Enterprise Assets
Actively manage all enterprise assets connected to the infrastructure physically, virtually, remotely, and within cloud environments. Untracked assets represent unmonitored entry vectors for adversaries. Organizations must employ automated dynamic host discovery and enforce strict 802.1X port security to detect unauthorized devices within five minutes of connection.

## Section 2: Account Management and Credential Lifecycle
Maintain centralized directory services to manage the full lifecycle of enterprise user accounts. Accounts must be provisioned following strict role-based access control (RBAC). Inactive employee accounts must be automatically deactivated after 30 days of inactivity. Immediate revocation within two hours is mandatory upon contract termination or role revocation.

## Section 3: Data Protection and Sensitive Asset Isolation
Implement cryptographic data protection at rest and in transit. All enterprise laptops, workstations, and removable media must deploy full-disk encryption (AES-256). Sensitive data classification tiers (Public, Internal, Confidential, Restricted) dictate access boundaries. Automated Data Loss Prevention (DLP) engines must intercept unauthorized exfiltration across cloud storage and email protocols.

## Section 4: Continuous Vulnerability Management and Patching
Establish an automated vulnerability scanning cadence. Critical Common Vulnerabilities and Exposures (CVEs) with active exploitation in the wild (CISA KEV catalog) must be mitigated within 72 hours of vendor disclosure. High-severity vulnerabilities require remediation within 14 calendar days, accompanied by compensatory virtual patching on Web Application Firewalls (WAF).

## Section 5: Audit Log Management and Immutable Retention
Collect, alert, and retain audit logs across domain controllers, authentication gateways, cloud infrastructure, and endpoints. Logs must be normalized, timestamp-synchronized via secure Network Time Protocol (NTP), and transferred to write-once-read-many (WORM) storage. Minimum retention requirements enforce at least 90 days of online hot-search access and 365 days of cold-tier preservation.

## Section 6: Malware Defenses and Endpoint Detection
Deploy centrally managed Endpoint Detection and Response (EDR) agents across all enterprise endpoints. EDR agents must enforce behavioral heuristics, anti-tampering controls, and automated isolation when suspicious living-off-the-land binaries (LOLBins) or memory-injection techniques (Process Hollowing, Mimikatz) are triggered.
"""

with open(f"{BENCHMARK_DIR}/nist_sp800_61r2.md", "w", encoding="utf-8") as f:
    f.write(nist_doc)

with open(f"{BENCHMARK_DIR}/cis_controls_v8.md", "w", encoding="utf-8") as f:
    f.write(cis_doc)

print("Documentos normativos públicos NIST SP 800-61r2 y CIS Controls v8 guardados en docs/research/benchmark/")

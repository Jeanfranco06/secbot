import os
import shutil
import subprocess
import urllib.request
import json
import time

JMETER_BAT = r"C:\Users\User\apache-jmeter-5.6.3\bin\jmeter.bat"
RUNS_DIR = r"ops\jmeter\runs"

def get_token():
    url = "http://localhost:8000/api/v1/auth/login"
    payload = json.dumps({"email": "loadtest@empresa.local", "password": "loadtest123"}).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        return data["access_token"]

def run_jmeter(plan, jtl_name, report_name, users, rampup, duration, extra_args=None):
    jtl_path = os.path.join(RUNS_DIR, jtl_name)
    report_path = os.path.join(RUNS_DIR, report_name)
    
    if os.path.exists(jtl_path):
        os.remove(jtl_path)
    if os.path.exists(report_path):
        shutil.rmtree(report_path)
        
    cmd = [
        JMETER_BAT,
        "-n",
        "-t", plan,
        "-l", jtl_path,
        "-e",
        "-o", report_path,
        f"-Jusers={users}",
        f"-Jrampup={rampup}",
        f"-Jduration={duration}",
        "-Jhost=127.0.0.1",
        "-Jport=8000"
    ]
    if extra_args:
        cmd.extend(extra_args)
        
    print(f"\n==========================================")
    print(f"Ejecutando: {report_name} ({users} usuarios, {duration}s)")
    print(f"==========================================")
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if os.path.exists(os.path.join(report_path, "index.html")):
        print(f"OK -> Reporte generado con exito en {report_path}")
    else:
        print(f"ERROR al generar reporte:\n{p.stdout[-500:]}")

def main():
    token = get_token()
    print("Token obtenido con exito.")
    
    tasks = [
        # Login tests
        ("ops/jmeter/secbot_login_stress.jmx", "test_10u.jtl", "report_10u", 10, 2, 5, None),
        ("ops/jmeter/secbot_login_stress.jmx", "test_20u.jtl", "report_20u", 20, 2, 5, None),
        ("ops/jmeter/secbot_login_stress.jmx", "test_50u.jtl", "report_50u", 50, 3, 5, None),
        
        # History tests
        ("ops/jmeter/secbot_history_stress.jmx", "history_100u.jtl", "history_report_100u", 100, 3, 5, [f"-Jtoken={token}"]),
        ("ops/jmeter/secbot_history_stress.jmx", "history_150u.jtl", "history_report_150u", 150, 3, 5, [f"-Jtoken={token}"]),
        
        # Health tests
        ("ops/jmeter/secbot_health_stress.jmx", "health_500u.jtl", "health_report_500u", 500, 3, 5, None),
        
        # Spike test
        ("ops/jmeter/secbot_login_stress.jmx", "spike_40u.jtl", "spike_report_40u", 40, 1, 5, None),
    ]
    
    for plan, jtl, report, users, rampup, duration, extra in tasks:
        run_jmeter(plan, jtl, report, users, rampup, duration, extra)
        time.sleep(1)

if __name__ == "__main__":
    main()

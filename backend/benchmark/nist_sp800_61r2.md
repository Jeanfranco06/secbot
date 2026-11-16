# NIST SP 800-61 Rev. 2: Computer Security Incident Handling Guide

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

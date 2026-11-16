# CIS Critical Security Controls v8: Enterprise Implementation Playbook

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

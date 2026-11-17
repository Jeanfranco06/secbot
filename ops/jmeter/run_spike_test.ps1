# ops/jmeter/run_spike_test.ps1
$ErrorActionPreference = "Stop"

$jmeterJar = "C:\jmeter\bin\ApacheJMeter.jar"
$jmxPlan = "ops\jmeter\secbot_login_stress.jmx"
$runsDir = "ops\jmeter\runs"

Write-Host "=========================================================================="
Write-Host "  EJECUTANDO PRUEBA DE POTENCIA / PICO SÚBITO (SPIKE TESTING)             "
Write-Host "=========================================================================="
Write-Host "Inyectando pico súbito de 40 usuarios en 1 segundo (2x la capacidad normal)..."

$jtlFile = "$runsDir\spike_40u.jtl"
$reportDir = "$runsDir\spike_report_40u"

Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $jtlFile, $reportDir

$argsList = @(
    "-jar", $jmeterJar,
    "-n",
    "-t", $jmxPlan,
    "-l", $jtlFile,
    "-e",
    "-o", $reportDir,
    "-Jusers=40",
    "-Jrampup=1",
    "-Jduration=20"
)

$p = Start-Process -FilePath "java" -ArgumentList $argsList -NoNewWindow -Wait -PassThru

$lines = Import-Csv -Path $jtlFile
$total = $lines.Count
$errors = ($lines | Where-Object { $_.success -ne "true" }).Count
$errRate = [math]::Round(($errors / $total) * 100, 2)
$elapsedTimes = $lines | ForEach-Object { [int]$_.elapsed } | Sort-Object

$min = $elapsedTimes[0]
$max = $elapsedTimes[-1]
$avg = [math]::Round(($elapsedTimes | Measure-Object -Average).Average, 1)

$p50 = $elapsedTimes[[math]::Floor($total * 0.50)]
$p90 = $elapsedTimes[[math]::Floor($total * 0.90)]
$p95 = $elapsedTimes[[math]::Floor($total * 0.95)]
$p99 = $elapsedTimes[[math]::Floor($total * 0.99)]

$throughput = [math]::Round($total / 20, 2)

$runData = [PSCustomObject]@{
    TipoPrueba = "Potencia (Spike)"
    UsuariosPico = 40
    RampUpSec = 1
    Peticiones = $total
    Errores = $errors
    TasaErrorPct = $errRate
    ThroughputReqSec = $throughput
    MediaMs = $avg
    MedianaP50Ms = $p50
    P90Ms = $p90
    P95Ms = $p95
    P99Ms = $p99
    MinMs = $min
    MaxMs = $max
    Observacion = "Evalúa resiliencia ante picos de demanda instantáneos"
}

$runData | Export-Csv -Path "$runsDir\spike_summary.csv" -NoTypeInformation
$runData | ConvertTo-Json -Depth 4 | Set-Content -Path "$runsDir\spike_summary.json"

Write-Host "`nResultados Prueba de Potencia:"
$runData | Format-List

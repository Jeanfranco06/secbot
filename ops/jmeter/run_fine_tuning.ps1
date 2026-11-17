# ops/jmeter/run_fine_tuning.ps1
$ErrorActionPreference = "Stop"

$jmeterJar = "C:\jmeter\bin\ApacheJMeter.jar"
$jmxPlan = "ops\jmeter\secbot_login_stress.jmx"
$runsDir = "ops\jmeter\runs"

$userSteps = @(12, 15, 18, 20, 22)
$duration = 25
$rampup = 5

$results = @()

Write-Host "=========================================================================="
Write-Host "  AFINAMIENTO DE ALTA PRECISIÓN: BUSCANDO EL MÁXIMO EXACTO (10-25 USUARIOS) "
Write-Host "=========================================================================="

foreach ($u in $userSteps) {
    Write-Host "`n---> Evaluando $u usuarios concurrentes..."
    $jtlFile = "$runsDir\test_${u}u.jtl"
    $reportDir = "$runsDir\report_${u}u"

    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $jtlFile, $reportDir

    $argsList = @(
        "-jar", $jmeterJar,
        "-n",
        "-t", $jmxPlan,
        "-l", $jtlFile,
        "-e",
        "-o", $reportDir,
        "-Jusers=$u",
        "-Jrampup=$rampup",
        "-Jduration=$duration"
    )

    $p = Start-Process -FilePath "java" -ArgumentList $argsList -NoNewWindow -Wait -PassThru

    if (-not (Test-Path $jtlFile)) {
        Write-Host "Error en corrida $u"
        break
    }

    $lines = Import-Csv -Path $jtlFile
    $total = $lines.Count
    if ($total -eq 0) { continue }

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

    $throughput = [math]::Round($total / $duration, 2)

    $status = if ($errRate -eq 0 -and $p95 -lt 6000) { "ESTABLE (Capacidad Óptima)" } elseif ($errRate -le 1.0) { "MÁXIMO ADMISIBLE (SLA)" } else { "DEGRADADO / QUIEBRE" }

    $runData = [PSCustomObject]@{
        Usuarios = $u
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
        Estado = $status
    }

    $results += $runData

    Write-Host ("Usuarios: {0} | Throughput: {1} req/s | Media: {2} ms | P95: {3} ms | Error: {4}% | Estado: {5}" -f $u, $throughput, $avg, $p95, $errRate, $status)

    Start-Sleep -Seconds 5
}

# Exportar resultados de afinamiento
$results | Export-Csv -Path "$runsDir\fine_tuning_summary.csv" -NoTypeInformation
$results | ConvertTo-Json -Depth 4 | Set-Content -Path "$runsDir\fine_tuning_summary.json"

Write-Host "`n=========================================================================="
Write-Host "                RESULTADOS DEL AFINAMIENTO DE PRECISIÓN                   "
Write-Host "=========================================================================="
$results | Format-Table -AutoSize

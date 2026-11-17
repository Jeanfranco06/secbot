# ops/jmeter/run_escalation.ps1
$ErrorActionPreference = "Stop"

$jmeterJar = "C:\jmeter\bin\ApacheJMeter.jar"
$jmxPlan = "ops\jmeter\secbot_login_stress.jmx"
$runsDir = "ops\jmeter\runs"

$userSteps = @(10, 25, 50, 75, 100, 150, 200, 250)
$duration = 25
$rampup = 5

$results = @()

Write-Host "=========================================================================="
Write-Host "  INICIANDO BÚSQUEDA DEL MÁXIMO DE USUARIOS CONCURRENTES (ENSAYO Y ERROR) "
Write-Host "=========================================================================="

foreach ($u in $userSteps) {
    Write-Host "`n---> Ejecutando prueba con $u usuarios concurrentes..."
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

    $startTime = Get-Date
    $p = Start-Process -FilePath "java" -ArgumentList $argsList -NoNewWindow -Wait -PassThru
    $endTime = Get-Date
    $actualDurationSec = ($endTime - $startTime).TotalSeconds

    if (-not (Test-Path $jtlFile)) {
        Write-Host "Error: No se generó el archivo de resultados para $u usuarios."
        break
    }

    # Procesar archivo .jtl (CSV)
    $lines = Import-Csv -Path $jtlFile
    $total = $lines.Count
    if ($total -eq 0) {
        Write-Host "Prueba sin muestras registradas."
        break
    }

    $errors = ($lines | Where-Object { $_.success -ne "true" }).Count
    $errRate = [math]::Round(($errors / $total) * 100, 2)
    $elapsedTimes = $lines | ForEach-Object { [int]$_.elapsed } | Sort-Object

    $min = $elapsedTimes[0]
    $max = $elapsedTimes[-1]
    $avg = [math]::Round(($elapsedTimes | Measure-Object -Average).Average, 1)

    $p50Index = [math]::Floor($total * 0.50)
    $p90Index = [math]::Floor($total * 0.90)
    $p95Index = [math]::Floor($total * 0.95)
    $p99Index = [math]::Floor($total * 0.99)

    $p50 = $elapsedTimes[$p50Index]
    $p90 = $elapsedTimes[$p90Index]
    $p95 = $elapsedTimes[$p95Index]
    $p99 = $elapsedTimes[$p99Index]

    $throughput = [math]::Round($total / $duration, 2)

    $status = if ($errRate -eq 0 -and $p95 -lt 8000) { "ESTABLE" } elseif ($errRate -le 2.0) { "LÍMITE ADMISIBLE" } else { "PUNTO DE QUIEBRE" }

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

    if ($errRate -ge 10.0) {
        Write-Host "`n[!] Punto de quiebre alcanzado con $u usuarios (Tasa de error >= 10%). Deteniendo escalamiento."
        break
    }

    # Pequeño respiro al servidor para drenar conexiones y GC
    Start-Sleep -Seconds 5
}

# Exportar resultados estructurados
$results | Export-Csv -Path "$runsDir\benchmark_summary.csv" -NoTypeInformation
$results | ConvertTo-Json -Depth 4 | Set-Content -Path "$runsDir\benchmark_summary.json"

Write-Host "`n=========================================================================="
Write-Host "                RESUMEN FINAL DE LA EXPERIMENTACIÓN                      "
Write-Host "=========================================================================="
$results | Format-Table -AutoSize

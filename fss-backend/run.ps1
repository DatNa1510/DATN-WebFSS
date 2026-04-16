Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " FSS BACKEND STARTUP - AUTO FIX JAVA VERSION" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

$jdkUrl = "https://download.java.net/java/GA/jdk17.0.2/dfd4a8d0985749f896bed50d7138ee7f/8/GPL/openjdk-17.0.2_windows-x64_bin.zip"
$jdkZip = "jdk17.zip"
$jdkDir = "jdk-17.0.2"

If (-Not (Test-Path $jdkDir)) {
    Write-Host "[1/3] Old Java version detected. Downloading Java 17 automatically..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $jdkUrl -OutFile $jdkZip
    
    Write-Host "[2/3] Extracting Java 17... (Please wait a few seconds)" -ForegroundColor Yellow
    Expand-Archive $jdkZip -DestinationPath . -Force
    
    Remove-Item $jdkZip
} Else {
    Write-Host "[*] Found local Java 17 installed previously." -ForegroundColor Green
}

Write-Host "[3/3] Setting up environment and starting Spring Boot Backend..." -ForegroundColor Yellow
$env:JAVA_HOME = "$PWD\$jdkDir"

.\apache-maven-3.9.6\bin\mvn.cmd clean spring-boot:run

$ErrorActionPreference = "Stop"

$ImageName = "pm-mvp"
$ContainerName = "pm-mvp"
$EnvFile = Join-Path (Get-Location) ".env"
$EnvArgs = @()

if (Test-Path $EnvFile) {
    $EnvArgs = @("--env-file", $EnvFile)
}

docker build -t $ImageName .
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$ExistingContainer = docker ps -aq --filter "name=^/$ContainerName$"
if ($ExistingContainer) {
    docker rm -f $ContainerName | Out-Null
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

docker run -d --name $ContainerName -p 8000:8000 @EnvArgs $ImageName
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Project Management MVP is running at http://localhost:8000"
if (-not (Test-Path $EnvFile)) {
    Write-Host "No .env file found. AI chat requires OPENROUTER_API_KEY to be set."
}

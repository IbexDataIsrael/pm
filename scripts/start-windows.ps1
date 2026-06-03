$ErrorActionPreference = "Stop"

$ImageName = "pm-mvp"
$ContainerName = "pm-mvp"

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

docker run -d --name $ContainerName -p 8000:8000 $ImageName
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Project Management MVP is running at http://localhost:8000"

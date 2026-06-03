$ErrorActionPreference = "Stop"

$ContainerName = "pm-mvp"
$ExistingContainer = docker ps -aq --filter "name=^/$ContainerName$"

if ($ExistingContainer) {
    docker rm -f $ContainerName | Out-Null
    Write-Host "Stopped Project Management MVP."
} else {
    Write-Host "Project Management MVP is not running."
}

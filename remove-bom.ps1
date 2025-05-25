# PowerShell script to remove BOM from UTF-8 files

$targetDirs = @("app", "components", "lib", "utils")

function Remove-Bom {
    param (
        [string]$Path
    )

    $bytes = [System.IO.File]::ReadAllBytes($Path)

    # Check for UTF-8 BOM (EF BB BF)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        Write-Host "Removing BOM from: $Path"
        $newBytes = New-Object byte[] ($bytes.Length - 3)
        [System.Array]::Copy($bytes, 3, $newBytes, 0, $newBytes.Length)
        [System.IO.File]::WriteAllBytes($Path, $newBytes)
        return $true
    }
    return $false
}

function Get-ChildFilesRecursive {
    param (
        [string]$Directory,
        [string]$FilePattern
    )
    Get-ChildItem -Path $Directory -Recurse -Include $FilePattern | Where-Object {!$_.PSIsContainer}
}

Write-Host "Starting BOM removal process..."
$fixedFilesCount = 0

foreach ($dir in $targetDirs) {
    $fullPath = Join-Path (Get-Location) $dir
    Write-Host "Searching in: $fullPath"

    $tsxFiles = Get-ChildFilesRecursive -Directory $fullPath -FilePattern "*.tsx"
    $tsFiles = Get-ChildFilesRecursive -Directory $fullPath -FilePattern "*.ts"

    foreach ($file in $tsxFiles + $tsFiles) {
        if (Remove-Bom -Path $file.FullName) {
            $fixedFilesCount++
        }
    }
}

Write-Host "Finished BOM removal. Total files processed: $fixedFilesCount"

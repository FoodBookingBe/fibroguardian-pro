# Cleanup Script for FibroGuardian Project
# Zorg dat je PowerShell als Administrator opstart.
# Dit script verwijdert de .next- en node_modules-mappen en voert daarna een verse installatie van de dependencies uit.

Write-Output "Start cleanup process..."

# Verwijder de .next-map
Write-Output "Removing .next directory..."
Try {
    Remove-Item -Recurse -Force .next -ErrorAction Stop
    Write-Output ".next directory removed successfully."
} Catch {
    Write-Output "Error removing .next directory: $_"
}

# Verwijder de node_modules-map
Write-Output "Removing node_modules directory..."
Try {
    Remove-Item -Recurse -Force node_modules -ErrorAction Stop
    Write-Output "node_modules directory removed successfully."
} Catch {
    Write-Output "Error removing node_modules directory: $_"
    Write-Output "Controleer of er geen processen zijn die bestanden vergrendelen en voer het script als Administrator uit."
}

# Installeer de dependencies opnieuw
Write-Output "Running npm install..."
npm install

Write-Output "Cleanup and reinstallation complete."

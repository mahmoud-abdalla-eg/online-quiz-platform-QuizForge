$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
        }
    }
}

if (Get-Command mvn -ErrorAction SilentlyContinue) {
    mvn package
    java -jar "target/online-quiz-platform-1.0.0.jar"
    exit
}

$libJars = Get-ChildItem "lib" -Filter "*.jar" -ErrorAction SilentlyContinue
if ($libJars.Count -eq 0) {
    Write-Host "Maven is not installed and no dependency jars were found in lib/."
    Write-Host "Install Maven, or place these jars in lib/: mongodb-driver-sync, bson, mongodb-driver-core, gson."
    exit 1
}

New-Item -ItemType Directory -Force "out" | Out-Null
$classpath = "lib/*"
$sources = Get-ChildItem "src/main/java" -Recurse -Filter "*.java" | ForEach-Object { $_.FullName }
javac -cp $classpath -d "out" $sources
java -cp "out;lib/*" com.quizapp.Main

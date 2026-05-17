@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM Apache Maven Wrapper startup script for Windows, version 3.3.2

@ECHO off
SETLOCAL EnableDelayedExpansion

SET "MAVEN_PROJECTBASEDIR=%~dp0"
IF "%MAVEN_PROJECTBASEDIR:~-1%"=="\" SET "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"

@REM Find project basedir walking up from current dir
:findBaseDir
IF EXIST "%MAVEN_PROJECTBASEDIR%\.mvn" GOTO baseDirFound
SET "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR%\.."
GOTO findBaseDir
:baseDirFound

@REM Resolve to absolute path
FOR /F "delims=" %%D IN ("%MAVEN_PROJECTBASEDIR%") DO SET "MAVEN_PROJECTBASEDIR=%%~fD"

SET "PROPS_FILE=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties"
IF NOT EXIST "%PROPS_FILE%" (
  ECHO ERROR: Cannot find %PROPS_FILE% >&2
  EXIT /B 1
)

@REM Read distributionUrl using PowerShell for robustness
FOR /F "delims=" %%U IN ('powershell -NoProfile -Command "(Get-Content '%PROPS_FILE%' | Where-Object { $_ -match '^distributionUrl=' }) -replace '^distributionUrl=',''"') DO (
  SET "DISTRIBUTION_URL=%%U"
)

IF "!DISTRIBUTION_URL!"=="" (
  ECHO ERROR: distributionUrl not set in %PROPS_FILE% >&2
  EXIT /B 1
)

@REM Extract filename and base dir name from URL
FOR /F "delims=" %%F IN ('powershell -NoProfile -Command "[System.IO.Path]::GetFileName('!DISTRIBUTION_URL!')"') DO SET "ZIP_NAME=%%F"
SET "DIR_NAME=%ZIP_NAME:-bin.zip=%"

@REM Set Maven user home
IF NOT DEFINED MAVEN_USER_HOME (
  IF DEFINED USERPROFILE (
    SET "MAVEN_USER_HOME=%USERPROFILE%\.m2"
  ) ELSE (
    SET "MAVEN_USER_HOME=%HOMEPATH%\.m2"
  )
)

SET "CACHE_DIR=%MAVEN_USER_HOME%\wrapper\dists\%DIR_NAME%"
SET "MAVEN_HOME=%CACHE_DIR%\%DIR_NAME%"

@REM Download and install Maven if not cached
IF NOT EXIST "%MAVEN_HOME%\" (
  IF NOT EXIST "%CACHE_DIR%\" MKDIR "%CACHE_DIR%"
  ECHO Downloading Maven %DIR_NAME%...
  ECHO   from: !DISTRIBUTION_URL!

  SET "DOWNLOAD_FILE=%TEMP%\%ZIP_NAME%"

  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$url = '!DISTRIBUTION_URL!'; $out = '!DOWNLOAD_FILE!'; try { (New-Object System.Net.WebClient).DownloadFile($url, $out); Write-Host 'Download complete.' } catch { Write-Error $_.Exception.Message; exit 1 }"

  IF ERRORLEVEL 1 (
    ECHO ERROR: Download failed >&2
    EXIT /B 1
  )

  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('!DOWNLOAD_FILE!', '!CACHE_DIR!')"

  IF ERRORLEVEL 1 (
    ECHO ERROR: Extraction failed >&2
    EXIT /B 1
  )

  DEL /Q "!DOWNLOAD_FILE!" 2>NUL
  ECHO Maven installed to !MAVEN_HOME!
)

SET "MVN_CMD=%MAVEN_HOME%\bin\mvn.cmd"
IF NOT EXIST "%MVN_CMD%" SET "MVN_CMD=%MAVEN_HOME%\bin\mvn"

"%MVN_CMD%" %*
EXIT /B %ERRORLEVEL%

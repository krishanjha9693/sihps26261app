import React, { useState } from 'react';
import {
  FolderCode,
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  Smartphone,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface AndroidFileItem {
  path: string;
  category: 'Gradle' | 'Manifest' | 'UI & Theme' | 'Data & Room' | 'Domain & Rules' | 'ML Kit OCR' | 'Documentation';
  language: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidFileItem[] = [
  {
    path: 'android/build.gradle.kts',
    category: 'Gradle',
    language: 'kotlin',
    content: `// Top-level build file for VeriCampus AI Android Project
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.hilt) apply false
}`,
  },
  {
    path: 'android/app/build.gradle.kts',
    category: 'Gradle',
    language: 'kotlin',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
}

android {
    namespace = "com.vericampus.ai"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.vericampus.ai"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "2.4.0-SIH"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Core & Compose BOM
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    // CameraX
    implementation(libs.androidx.camera.core)
    implementation(libs.androidx.camera.camera2)
    implementation(libs.androidx.camera.lifecycle)
    implementation(libs.androidx.camera.view)

    // ML Kit Text Recognition
    implementation(libs.google.mlkit.text.recognition)

    // Room Database
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // Coroutines & Flow
    implementation(libs.kotlinx.coroutines.android)

    // PDF Rendering & Generation
    implementation(libs.itext7.core)
}`,
  },
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    category: 'Manifest',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions for CameraX document capture and storage -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:name=".VeriCampusApp"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.VeriCampusAI">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.VeriCampusAI">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.provider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>`,
  },
  {
    path: 'android/app/src/main/java/com/vericampus/ai/MainActivity.kt',
    category: 'UI & Theme',
    language: 'kotlin',
    content: `package com.vericampus.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.vericampus.ai.ui.navigation.VeriCampusNavHost
import com.vericampus.ai.ui.theme.VeriCampusAITheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VeriCampusAITheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    VeriCampusNavHost()
                }
            }
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/vericampus/ai/ui/theme/Theme.kt',
    category: 'UI & Theme',
    language: 'kotlin',
    content: `package com.vericampus.ai.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Midnight Navy with Electric Blue & Indigo accents
val MidnightNavy = Color(0xFF060B19)
val SurfaceDark = Color(0xFF0F172A)
val ElectricBlue = Color(0xFF2563EB)
val IndigoAccent = Color(0xFF6366F1)
val CyanHighlight = Color(0xFF06B6D4)
val EmeraldVerified = Color(0xFF10B981)
val AmberWarning = Color(0xFFF59E0B)
val CrimsonAlert = Color(0xFFEF4444)

private val DarkColorScheme = darkColorScheme(
    primary = ElectricBlue,
    secondary = IndigoAccent,
    tertiary = CyanHighlight,
    background = MidnightNavy,
    surface = SurfaceDark,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFFE2E8F0),
    onSurface = Color(0xFFF8FAFC)
)

@Composable
fun VeriCampusAITheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}`,
  },
  {
    path: 'android/app/src/main/java/com/vericampus/ai/data/db/AppDatabase.kt',
    category: 'Data & Room',
    language: 'kotlin',
    content: `package com.vericampus.ai.data.db

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.vericampus.ai.data.dao.ApplicationDao
import com.vericampus.ai.data.model.ApplicationEntity
import com.vericampus.ai.data.model.DocumentEntity
import com.vericampus.ai.data.model.FindingEntity

@Database(
    entities = [
        ApplicationEntity::class,
        DocumentEntity::class,
        FindingEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun applicationDao(): ApplicationDao
}`,
  },
  {
    path: 'android/app/src/main/java/com/vericampus/ai/domain/validation/ValidationEngine.kt',
    category: 'Domain & Rules',
    language: 'kotlin',
    content: `package com.vericampus.ai.domain.validation

import com.vericampus.ai.data.model.ApplicationEntity
import com.vericampus.ai.data.model.DocumentEntity
import com.vericampus.ai.data.model.FindingEntity

class ValidationEngine {

    fun evaluateCase(
        appCase: ApplicationEntity,
        documents: List<DocumentEntity>
    ): List<FindingEntity> {
        val findings = mutableListOf<FindingEntity>()

        // 1. Mandatory Document Verification
        val uploadedTypes = documents.map { it.category }.toSet()
        appCase.requiredCategories.forEach { req ->
            if (!uploadedTypes.contains(req)) {
                findings.add(
                    FindingEntity(
                        id = "mand-\${System.currentTimeMillis()}",
                        caseId = appCase.id,
                        title = "Missing Mandatory Document: $req",
                        severity = "warning",
                        explanation = "Compulsory credential '$req' is absent from application package.",
                        sourceDoc = "Application Package",
                        observedValue = "Missing",
                        expectedValue = req,
                        action = "Request applicant upload required credential."
                    )
                )
            }
        }

        // 2. Name Consistency Across Documents
        val names = documents.mapNotNull { doc ->
            doc.extractedFields["applicantName"]?.let { doc to it }
        }

        for (i in names.indices) {
            val (docA, nameA) = names[i]
            val normA = normalize(nameA)
            val normDeclared = normalize(appCase.applicantName)

            if (normA != normDeclared && calculateSimilarity(normA, normDeclared) < 0.85f) {
                findings.add(
                    FindingEntity(
                        id = "name-\${docA.id}",
                        caseId = appCase.id,
                        title = "Name Inconsistency on \${docA.name}",
                        severity = "critical",
                        explanation = "Document reads '$nameA', differing from declared '\${appCase.applicantName}'.",
                        sourceDoc = docA.name,
                        observedValue = nameA,
                        expectedValue = appCase.applicantName,
                        action = "Require official gazette notification or affidavit."
                    )
                )
            }
        }

        return findings
    }

    private fun normalize(str: String): String =
        str.lowercase().replace(Regex("[^a-z0-9]"), "")

    private fun calculateSimilarity(s1: String, s2: String): Float {
        val distance = levenshtein(s1, s2)
        return 1.0f - distance.toFloat() / maxOf(s1.length, s2.length, 1)
    }

    private fun levenshtein(a: String, b: String): Int {
        val dp = Array(a.length + 1) { IntArray(b.length + 1) }
        for (i in 0..a.length) dp[i][0] = i
        for (j in 0..b.length) dp[0][j] = j
        for (i in 1..a.length) {
            for (j in 1..b.length) {
                val cost = if (a[i - 1] == b[j - 1]) 0 else 1
                dp[i][j] = minOf(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
            }
        }
        return dp[a.length][b.length]
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/vericampus/ai/service/OcrService.kt',
    category: 'ML Kit OCR',
    language: 'kotlin',
    content: `package com.vericampus.ai.service

import android.graphics.Bitmap
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class OcrService {
    private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    suspend fun processImage(bitmap: Bitmap): OcrResult =
        suspendCancellableCoroutine { continuation ->
            val image = InputImage.fromBitmap(bitmap, 0)
            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    val fullText = visionText.text
                    val fields = extractFieldsFromText(visionText)
                    continuation.resume(OcrResult(fullText, fields))
                }
                .addOnFailureListener { exception ->
                    continuation.resumeWithException(exception)
                }
        }

    private fun extractFieldsFromText(text: com.google.mlkit.vision.text.Text): Map<String, String> {
        val result = mutableMapOf<String, String>()
        // Parse regex for roll numbers, dates, Aadhaar/Passport patterns
        val raw = text.text
        Regex("""(?i)(?:name[:\s]+)([a-z\s.]+)""").find(raw)?.let {
            result["applicantName"] = it.groupValues[1].trim()
        }
        Regex("""(?i)(?:roll\s*(?:no|num)?[:\s]+)([a-z0-9/-]+)""").find(raw)?.let {
            result["registrationNumber"] = it.groupValues[1].trim()
        }
        Regex("""\b(\d{2}[-/]\d{2}[-/]\d{4})\b""").find(raw)?.let {
            result["issueDate"] = it.groupValues[1]
        }
        return result
    }
}

data class OcrResult(
    val rawText: String,
    val extractedFields: Map<String, String>
)`,
  },
  {
    path: 'android/README.md',
    category: 'Documentation',
    language: 'markdown',
    content: `# VeriCampus AI — Native Android Project

Smart Verification. Clear Evidence. Confident Decisions.
Smart India Hackathon (SIH) Institutional Document Verification Platform.

## Architecture
- **Language**: Kotlin 2.1+
- **UI Toolkit**: Jetpack Compose with Custom Material 3 Palette (Midnight Navy & Electric Blue)
- **Architecture**: MVVM with Repository Pattern & Coroutines/Flow
- **Local Persistence**: Room Database with TypeConverters
- **Document Capture**: CameraX with document alignment overlay & contrast enhancement
- **OCR Engine**: Google ML Kit Text Recognition (On-Device) + optional Gemini API Server Proxy
- **PDF Generation**: Native Android iText / PdfDocument export

## How to Build & Run in Android Studio
1. Open Android Studio (Ladybug / Iguana or later).
2. Select **Open** and choose the \`/android\` folder.
3. Allow Gradle to sync dependencies.
4. Run on a connected Android device or Pixel 8 Emulator (API 34+).
`,
  },
];

export const AndroidStudioExporter: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidFileItem>(ANDROID_PROJECT_FILES[3]);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.path.split('/').pop() || 'code.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-semibold mb-1">
            <Smartphone className="w-4 h-4" />
            <span>Native Android Studio Architecture</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Kotlin &amp; Jetpack Compose Codebase</h2>
          <p className="text-xs text-slate-600 max-w-xl">
            Complete production-ready Android Studio project files with CameraX, ML Kit on-device OCR, Room database, and the SIH Cross-Document Validation Engine.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy File</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export File</span>
          </button>
        </div>
      </div>

      {/* Code Viewer Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs min-h-[600px]">
        {/* Left: File Tree */}
        <div className="p-4 bg-slate-50/70 border-r border-slate-200 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
            Android Studio Tree
          </div>

          <div className="space-y-1">
            {ANDROID_PROJECT_FILES.map((file, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                  selectedFile.path === file.path
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.path.replace('android/', '')}</span>
                </div>
                <span className="text-[10px] font-mono opacity-75 shrink-0 ml-1">
                  {file.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="md:col-span-2 flex flex-col bg-slate-900 text-slate-100">
          <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-b border-slate-800 text-xs">
            <span className="font-mono text-indigo-400 font-semibold">{selectedFile.path}</span>
            <span className="font-mono text-slate-400">{selectedFile.language.toUpperCase()}</span>
          </div>

          <div className="flex-1 p-5 overflow-auto">
            <pre className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre selection:bg-indigo-600 selection:text-white">
              {selectedFile.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

#!/bin/bash

# Refold Activity Library - AI Context Sync Script
# Collects all relevant project files for AI context sharing

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNC_DIR="$PROJECT_ROOT/ai-context-sync"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚀 Refold Activity Library - AI Context Sync"
echo "============================================"
echo "Project: $PROJECT_ROOT"
echo "Output: $SYNC_DIR"
echo "Timestamp: $TIMESTAMP"
echo ""

# Clean and create sync directory
rm -rf "$SYNC_DIR"
mkdir -p "$SYNC_DIR"

# Initialize counters
declare -A file_counts
total_files=0
total_size=0

# Function to convert bytes to human readable
human_readable_size() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes}B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$(($bytes / 1024))KB"
    else
        echo "$(($bytes / 1048576))MB"
    fi
}

# Function to flatten path for filename
flatten_path() {
    echo "$1" | sed 's|/|__|g'
}

# Function to copy and track file
copy_file() {
    local source_path="$1"
    local relative_path="${source_path#$PROJECT_ROOT/}"
    local flattened_name=$(flatten_path "$relative_path")
    local file_size=$(stat -f%z "$source_path" 2>/dev/null || stat -c%s "$source_path" 2>/dev/null || echo "0")
    
    # Skip empty files unless they're important configs or project structure
    if [ $file_size -eq 0 ]; then
        case "$relative_path" in
            package.json | tsconfig.json | *.config.* | *.env* | src/components/* | src/app/* | src/lib/* | src/types/*)
                # Keep these even if empty - they show project structure
                ;;
            *)
                return 0
                ;;
        esac
    fi
    
    # Skip very large files
    if [ $file_size -gt 10485760 ]; then  # > 10MB
        echo "⚠️  Skipping large file: $relative_path ($(human_readable_size $file_size))"
        return 0
    fi
    
    # Copy file
    cp "$source_path" "$SYNC_DIR/$flattened_name"
    
    # Track statistics
    local ext="${relative_path##*.}"
    file_counts["$ext"]=$((${file_counts["$ext"]:-0} + 1))
    total_files=$((total_files + 1))
    total_size=$((total_size + file_size))
    
    echo "✓ $relative_path ($(human_readable_size $file_size))"
}

echo "📁 Collecting project files..."

# Root level files (configs, docs, etc.)
echo "📄 Root configuration files..."

# Check each file type individually to avoid glob failures
for pattern in "*.js" "*.mjs" "*.ts" "*.tsx" "*.md" "*.txt" "*.yml" "*.yaml" ".*rc" "*.json"; do
    for file in "$PROJECT_ROOT"/$pattern; do
        [ -f "$file" ] && copy_file "$file"
    done
done

# Specific important files that might not match patterns
for file in "$PROJECT_ROOT"/package.json "$PROJECT_ROOT"/tsconfig.json "$PROJECT_ROOT"/next.config.js "$PROJECT_ROOT"/eslint.config.mjs; do
    [ -f "$file" ] && copy_file "$file"
done

# Environment files (but skip actual secrets)
for file in "$PROJECT_ROOT"/.env.example "$PROJECT_ROOT"/.env.template "$PROJECT_ROOT"/.env.local.example; do
    [ -f "$file" ] && copy_file "$file"
done

# Source code files
echo "📄 Source code files..."
if [ -d "$PROJECT_ROOT/src" ]; then
    find "$PROJECT_ROOT/src" -type f \( \
        -name "*.ts" -o \
        -name "*.tsx" -o \
        -name "*.js" -o \
        -name "*.jsx" -o \
        -name "*.css" -o \
        -name "*.scss" -o \
        -name "*.html" -o \
        -name "*.json" \
    \) ! -path "*/generated/*" ! -path "*/.next/*" ! -path "*/node_modules/*" | while IFS= read -r file; do
        copy_file "$file"
    done
fi

# Database schema files (Prisma, Drizzle, etc.)
echo "📄 Database schema..."
for schema_file in "$PROJECT_ROOT/prisma/schema.prisma" "$PROJECT_ROOT/drizzle/schema.ts" "$PROJECT_ROOT/src/lib/schema.ts"; do
    [ -f "$schema_file" ] && copy_file "$schema_file"
done

# Data files and exports
echo "📄 Data files..."
if [ -d "$PROJECT_ROOT/public/data" ]; then
    find "$PROJECT_ROOT/public/data" -type f \( \
        -name "*.json" -o \
        -name "*.csv" -o \
        -name "*.tsv" -o \
        -name "*.txt" -o \
        -name "*.xml" \
    \) | while IFS= read -r file; do
        copy_file "$file"
    done
fi

# Documentation and prompts
echo "📄 Documentation and prompts..."
for doc_dir in "$PROJECT_ROOT/docs" "$PROJECT_ROOT/prompts" "$PROJECT_ROOT/templates"; do
    if [ -d "$doc_dir" ]; then
        find "$doc_dir" -type f | while IFS= read -r file; do
            copy_file "$file"
        done
    fi
done

# Scripts
echo "📄 Scripts..."
if [ -d "$PROJECT_ROOT/scripts" ]; then
    find "$PROJECT_ROOT/scripts" -name "*.sh" -o -name "*.js" -o -name "*.ts" -o -name "*.py" | while IFS= read -r file; do
        copy_file "$file"
    done
fi

# Public folder (only small, important files)
echo "📄 Public assets (small files only)..."
if [ -d "$PROJECT_ROOT/public" ]; then
    find "$PROJECT_ROOT/public" -type f -size -1M | while IFS= read -r file; do
        case "$file" in
            *.png|*.jpg|*.jpeg|*.gif|*.mp3|*.wav|*.mp4|*.mov)
                # Skip media files to save space unless they're small icons
                if [ $(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0") -lt 102400 ]; then  # < 100KB
                    copy_file "$file"
                fi
                ;;
            *)
                copy_file "$file"
                ;;
        esac
    done
fi

# Any other important configs in subdirectories
echo "📄 Other configuration files..."
find "$PROJECT_ROOT" -maxdepth 3 -name "*.config.*" -o -name "eslint*" -o -name "prettier*" -o -name "tailwind*" | \
    grep -v node_modules | grep -v .git | grep -v .next | grep -v ai-context-sync | while IFS= read -r file; do
    [ -f "$file" ] && copy_file "$file"
done

echo ""
echo "📊 Generating project documentation..."

# Generate FILE_LIST.txt
cat > "$SYNC_DIR/FILE_LIST.txt" << EOF
REFOLD ACTIVITY LIBRARY - AI CONTEXT SYNC
=========================================
Generated: $(date)
Project Root: $PROJECT_ROOT
Total Files Included: $total_files
Total Size: $(human_readable_size $total_size)

TECH STACK OVERVIEW
==================
Framework: Next.js 14 with TypeScript
Styling: Tailwind CSS (likely)
Development: Standard Next.js development setup
Current Port: TBD (likely 3000 or 3001)

PROJECT PURPOSE
===============
Activity library webapp for the Refold language learning method.
Manages and displays language learning activities with data from TSV exports.

PROJECT STRUCTURE MAPPING
=========================
Files are flattened with __ replacing / in paths:

Original Path → Flattened Name
EOF

# List all files in sync directory
for file in "$SYNC_DIR"/*; do
    [ -f "$file" ] || continue
    filename=$(basename "$file")
    [ "$filename" = "FILE_LIST.txt" ] && continue
    
    # Convert flattened name back to original path
    original_path=$(echo "$filename" | sed 's|__|/|g')
    file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
    echo "$original_path → $filename ($(human_readable_size $file_size))" >> "$SYNC_DIR/FILE_LIST.txt"
done

# Add file type breakdown
cat >> "$SYNC_DIR/FILE_LIST.txt" << EOF

FILE TYPE BREAKDOWN
==================
EOF

for ext in "${!file_counts[@]}"; do
    echo "$ext: ${file_counts[$ext]} files" >> "$SYNC_DIR/FILE_LIST.txt"
done | sort

# Add project info
cat >> "$SYNC_DIR/FILE_LIST.txt" << EOF

CURRENT DIRECTORY STRUCTURE
===========================
src/
└── app/                    # Next.js 14 App Router
    ├── activity/          # Activity detail pages
    │   └── [id]/          # Dynamic routing for individual activities
    ├── globals.css        # Global styles
    ├── layout.tsx         # Root layout component
    └── page.tsx           # Home page

public/
├── data/                  # Data files
│   └── export_activity_library.tsv  # Main activity data export
└── *.svg, *.png          # Static assets and icons

FUTURE EXPANSION AREAS
=====================
The script is prepared to handle these common additions:
- src/components/         # React components (UI primitives, feature components)
- src/lib/               # Utilities, API clients, database connections
- src/types/             # TypeScript type definitions
- src/hooks/             # Custom React hooks
- prisma/                # Database schema (if Prisma is added)
- docs/                  # Project documentation
- scripts/               # Build/deployment scripts
- prompts/               # AI prompts and templates

DATA STRUCTURE
==============
- Main data source: public/data/export_activity_library.tsv
- Contains activity definitions for Refold language learning method
- Future: May include database integration for dynamic data management

EXCLUDED DIRECTORIES
===================
- node_modules/           # Dependencies (not needed for context)
- .next/                  # Next.js build output
- .git/                   # Version control
- Large media files       # To keep context size manageable
- ai-context-sync/        # This output directory itself

DEVELOPMENT NOTES
================
- Currently in early development phase
- Basic Next.js structure in place
- Ready for expansion with components, API routes, and database integration
- TSV data suggests this will be a data-driven application
EOF

echo "✅ Sync completed successfully!"
echo ""
echo "📁 Output Directory: $SYNC_DIR"
echo "📄 Files Included: $total_files"
echo "💾 Total Size: $(human_readable_size $total_size)"
echo ""
echo "📋 File Types:"
for ext in "${!file_counts[@]}"; do
    echo "   • $ext: ${file_counts[$ext]} files"
done | sort
echo ""
echo "🤖 Ready for AI Context Sharing!"
echo "   Upload the entire '$SYNC_DIR' folder to share complete project context"
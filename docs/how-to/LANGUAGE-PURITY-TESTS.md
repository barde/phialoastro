# Language Purity Tests Documentation

## Overview

The language purity tests in `language-purity.test.tsx` ensure that the German and English versions of the site maintain proper language separation, particularly for tutorial titles and content.

## Key Features Added

### 1. English Title Word Detection
Added `FORBIDDEN_ENGLISH_TITLE_WORDS` constant with common English tutorial title words:
- Action words: Learn, Master, Create, Build, Design
- Prepositions: From, To, Into, Through, With
- Tutorial terms: Guide, Course, Class, Workshop, Tutorial
- Descriptors: Complete, Ultimate, Essential, Comprehensive

### 2. Tutorial Title-Specific Tests

#### `detects English tutorial titles in German version`
- Scans all tutorial titles for English words
- Logs warnings when English words are found
- Specifically catches titles like "From Sketch To Model"

#### `verifies English-language courses are properly marked`
- Ensures tutorials with 3+ English title words are marked as English content
- Validates that language indicators are present in categories

#### `ensures common English tutorial title patterns are translated`
- Checks for patterns like:
  - "Learn X" → Should be "Lern X"
  - "From X To Y" → Should be "Von X zu Y"
  - "X for Beginners" → Should be "X für Anfänger"

#### `detects specific untranslated English titles`
- Maintains a list of must-translate title patterns
- Provides suggested German translations
- Ensures English courses are properly marked

### 3. Enhanced Helper Functions

#### `checkComponentLanguagePurity`
- Added optional `checkTitles` parameter for title-specific validation
- Scans all heading elements (h1-h6) when enabled
- Provides detailed violation messages

#### `checkTutorialTitleLanguage`
- Analyzes a title to determine if it's in English
- Returns count of English words found
- Helps identify titles that need translation

## Usage in Testing

```typescript
// Check a component for language purity including titles
const { passed, violations } = checkComponentLanguagePurity(
  element, 
  'de',  // expected language
  true   // check titles
);

// Check if a specific title is in English
const { isEnglish, englishWords } = checkTutorialTitleLanguage(
  "From Sketch To Model",
  'de'
);
```

## Common Issues Detected

1. **Untranslated English Titles**: Titles like "Learn Blender" appearing in German version
2. **Mixed Language Content**: English descriptions under German UI
3. **Missing Language Indicators**: English courses not properly marked in German version
4. **Partial Translations**: Some words translated while others remain in English

## Expected Behavior

- German version should have all UI and German course content in German
- English courses in German version should be clearly marked as "English" or "Englisch"
- Common tutorial title patterns should be translated appropriately
- No English words should appear in German content unless it's marked as an English course
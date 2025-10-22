# ShiftMind — UX Flow (Stages 0–8)

## High-level User Journey
```mermaid
flowchart RL
    subgraph Auth
      A[כניסה לאתר] --> B{מחובר?}
      B -- לא --> C[מסך התחברות]
      C -->|הזדהות| D[בדיקת סשן]
      B -- כן --> D
    end

    D --> E[דף הבית]

    subgraph Home
      E --> CTA[צור סידור שבועי]
      E --> Emp[עובדים]
      E --> Avl[זמינות]
      E --> Bud[תקציבים]
      E --> Biz[הגדרות עסק]
      E -. תפריט משתמש .-> UIM[פרופיל • התנתקות]
    end

    CTA --> S1[מסך סידור שבועי]
    Emp --> EMP_L[רשימת עובדים]
    Avl --> AVL_L[רשימות זמינות]
    Bud --> BUD_L[רשימת תקציבים]
    Biz --> BIZ_S[הגדרות כלליות]

    subgraph Schedule
      S1 -->|Generate| S2[טיוטת סידור]
      S2 --> A1[פאנל התראות]
      S2 --> C1[עלות שבועית/תקציב]
      S2 --> DRAG[עריכה ידנית (Drag&Drop)]
      S2 --> TOOLS[כלים חכמים]
      TOOLS --> T1[איזון/אופטימיזציה]
      TOOLS --> T2[חיזוי (אם קיים cache)]
      S2 --> EXP[ייצוא PDF/XLSX]
    end

    subgraph Employees
      EMP_L --> EMP_C[יצירה/עריכה]
      EMP_C --> EMP_L
    end

    subgraph Availability
      AVL_L --> AVL_C[הוספת זמינות]
      AVL_C --> AVL_L
    end

    subgraph Budgets
      BUD_L --> BUD_C[הוספת תקציב]
      BUD_C --> BUD_L
    end

    subgraph Settings
      BIZ_S --> CAL[ניהול חגים/אירועים*]
      BIZ_S --> SEAS[פרופילי עונתיות*]
    end
```
*כוכבית מציינת מסכים אופציונליים/מתקדמים בשלב 5–6.

---

## מסכי מפתח ורכיבי ליבה

### 1) מסך התחברות (Login)
- אימייל בלבד (Magic Link או Simple Auth)
- מצב טעינה קצר + הודעת "ברוך/ה הבא/ה"

### 2) דף הבית (Home)
- **CTA ראשי:** "צור סידור שבועי"
- כרטיסים: עובדים, זמינות, תקציבים, הגדרות עסק
- תפריט משתמש בפינה: פרופיל / התנתקות

### 3) סידור שבועי (Schedule)
- לוח שבועי (ימים × שעות)
- סרגל תקציב + עלות בזמן אמת
- פאנל התראות (חוסר/עודף/חריגת תקציב)
- כלים חכמים (אופציונלי): איזון/חיזוי/אופטימיזציה
- ייצוא PDF/XLSX

### 4) עובדים (Employees)
- טבלה עם חיפוש/מיון/דפדוף
- יצירה/עריכה (שם, אימייל, תפקיד, שכר, מיומנויות)

### 5) זמינות (Availability)
- רשימה לפי עובד/יום שבוע
- בחירת טווחי זמן + תמיכה במשמרות לילה

### 6) תקציבים (Budgets)
- תקציב שבועי/חודשי + מטבע
- סינון לפי תקופה, סטטוס פעיל

### 7) הגדרות עסק (Settings)
- אזור זמן, תחילת שבוע, שעות פתיחה JSON
- (מתקדם) ניהול חגים/אירועים/עונתיות

---

## ניווט (Routes)
```
/                    → Home (Guarded)
/login               → Login
/schedule            → Schedule Board
/employees           → Employees list
/employees/new       → Employee create
/availability        → Availability list
/budgets             → Budgets list
/settings/business   → Business settings
/settings/seasonal*  → Seasonal profiles (advanced)
/settings/calendar*  → Calendar overrides (advanced)
/settings/events*    → Business events (advanced)
```

---

## עקרונות UI/UX קצרים
- RTL מלא, טיפוגרפיה ברורה, מרווחים נדיבים
- צבע ראשי יחיד ל-CTA, שאר הפעולות משניות
- עומס קוגניטיבי נמוך: בדף הבית רק קישורי ליבה
- מצב ריק/טעינה/שגיאה מנוסח בעברית ידידותית
- עקביות: כותרות, כפתורים, איקונים (Lucide), טופסי RHF+Zod

---

## To‑Do קצר לעיצוב/מימוש
- תפריט משתמש גלובלי (שם+התנתקות)
- הודעת Welcome אחרי לוגין
- דגשי נגישות: פוקוס, קונטרסט, aria‑labels
- רכיב BudgetBar אחיד לשימוש חוזר
- פאנל Alerts אחיד לשימוש חוזר


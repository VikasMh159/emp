# Employee Performance Tracker - Full Prototype

This is a comprehensive prototype for the **Employee Performance Tracker** Android application, built strictly according to the PRD.

## Tech Stack
- **Kotlin & Jetpack Compose (Material 3)**: Modern, responsive UI.
- **MVVM Architecture**: Clean separation of Model, View, and ViewModel.
- **Room Database**: Local persistence for all modules.
- **Repository Pattern**: Centralized data management.
- **Navigation Compose**: Seamless screen transitions.

## Mandatory Modules Implemented
1. **Employee Management**: Full CRUD for staff profiles.
2. **Task Assignment**: Assign, track, and update task status.
3. **Performance Review**: 5-metric rating system with history.
4. **Attendance Tracking**: Daily present/absent logs.
5. **Dashboard**: Stats, Top 3 Performers, and Low Performers.
6. **Analytics**: Bar, Pie, and Line charts for data-driven insights.
7. **Report Module**: CSV and Text report generation with filters.
8. **Notification UI**: Alerts for deadlines and pending reviews.
9. **Admin Access**: Splash screen and Login flow.
10. **Search & Filter**: Real-time staff filtering.

## Project Structure
- `data/local/`: Room Entities (`Employee`, `Task`, `Performance`, `Attendance`) and DAOs.
- `data/repository/`: `AppRepository` for unified data access.
- `ui/screens/`: 12+ Screens including Dashboard, Analytics, and Reports.
- `viewmodel/`: `MainViewModel` for state management.
- `util/`: `ReportUtil` for CSV/Text export logic.

## How to Run in Android Studio
1. Open the `android-prototype` folder in Android Studio.
2. Sync Gradle to install dependencies (`Room`, `Navigation`, `MPAndroidChart`).
3. Run on an emulator or device.

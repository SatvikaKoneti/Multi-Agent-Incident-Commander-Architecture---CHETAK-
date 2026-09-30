# Interactive Citizen Location Map Walkthrough

We have integrated an interactive, Leaflet-powered OpenStreetMap location selection experience into the **Citizen Portal** on the **Report an urban issue** (`CitizenSubmit`) page, as well as a location map display on the **Track report** (`CitizenTrack`) page.

---

## 1. Summary of Changes

### New Dependencies Added
- `leaflet` (`^1.9.4`)
- `react-leaflet` (`^4.2.1`)
- `@types/leaflet` (`^1.9.16`)

### Created Files
1. [ComplaintLocationMap.tsx](file:///c:/Users/megha/Downloads/SDC2-nyt1/SDC2/SDC/frontend/src/components/ComplaintLocationMap.tsx)
   - Dedicated, dark-futuristic Leaflet map component built with free OpenStreetMap tiles.
   - Default position: Centered on Hyderabad (`17.3850, 78.4867`).
   - Interactive features: Click-to-place pin marker, marker dragging, instant coordinate updates, and auto-detecting nearest Hyderabad planning locality (`HITEC City`, `Gachibowli`, `Kukatpally`, `Charminar`, etc.).
   - Includes read-only mode for complaint tracking.

### Modified Files
1. [citizen.tsx](file:///c:/Users/megha/Downloads/SDC2-nyt1/SDC2/SDC/frontend/src/views/citizen.tsx)
   - **`CitizenSubmit` Form**:
     - Embedded `ComplaintLocationMap` with click & drag location selection.
     - Added coordinate confirmation banner displaying selected `lat`, `lng`, and auto-detected `locality`.
     - Integrated "Locate me" GPS button to center map and place marker at current location.
     - Added validation: Form submission requires map location selection (`lat` and `lng`).
   - **`CitizenTrack` View**:
     - Added a dedicated complaint location map panel displaying stored coordinates with a pin marker when tracking a report.
2. [main.tsx](file:///c:/Users/megha/Downloads/SDC2-nyt1/SDC2/SDC/frontend/src/main.tsx)
   - Imported `leaflet/dist/leaflet.css` globally for proper tile rendering and marker positioning.

---

## 2. How Location Selection Works

1. **Map Interaction**:
   - The map opens centered on Hyderabad.
   - Clicking/tapping anywhere on the map places a glowing custom cyan pin marker and populates `lat` and `lng`.
   - The marker can be dragged anywhere to refine coordinates in real time.
2. **Locality Auto-Detection**:
   - As coordinates update, the map computes the nearest Hyderabad planning zone from the dataset coordinates (`HITEC City`, `Gachibowli`, `Charminar`, `Kukatpally`, `Begumpet`, `Secunderabad`, `Miyapur`, `Uppal`, `LB Nagar`, `Tarnaka`, `Dilsukhnagar`, `Kondapur`).
   - The detected locality automatically populates the Locality form field. Citizens can still manually adjust the field.
3. **"Locate Me" GPS Button**:
   - Clicking "Locate me" requests browser GPS location.
   - If granted, the map smoothly pans to the user's location, sets the pin marker, and updates `lat`, `lng`, and `locality`.
4. **Backend Transmission**:
   - Form submission packages `lat`, `lng`, `locality`, `area`, `title`, `description`, `category`, `severity_input`, `image`, and `video` into `FormData`.
   - The existing `/api/complaints` backend endpoint receives and stores numeric `lat` and `lng` in SQLite.
5. **Complaint Tracking Display**:
   - When looking up a tracking ID on `/citizen/track?q=<ID>`, the page displays a read-only map panel with the pin marker positioned at the complaint's stored latitude and longitude.

---

## 3. Commands to Run

### Run Backend
```bash
cd SDC2/SDC/backend
npm run dev
```

### Run Frontend
```bash
cd SDC2/SDC/frontend
npm run dev
```

### Verify Frontend Build & Typecheck
```bash
cd SDC2/SDC/frontend
npm run typecheck
npm run build
```

### Verify Backend Tests
```bash
cd SDC2/SDC/backend
npm test
```

---

## 4. Verification & Testing Results

- **Frontend Typecheck**: Passed with 0 errors (`tsc --noEmit`).
- **Frontend Build**: Production build completed successfully (`vite build`).
- **Backend Test Suite**: 61 / 61 tests passed (`npm test`).
- **Role Isolation & Portals**: Planner `MapView` and Authority portals remain completely unaffected and fully functional.

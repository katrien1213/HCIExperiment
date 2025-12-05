Multimodal Reading Experiment Runner

HCI Research Project - v2.1 Stable

OVERVIEW

This application is a web-based experimental platform designed to compare
two specific interaction paradigms for digital reading:

Baseline Condition: Traditional Mouse & Keyboard interaction.

Multimodal Condition: Eye-Tracking for vertical scrolling (Implicit)
and Voice Commands for annotation (Explicit).

The system simulates a full PDF reading environment (5-page academic paper)
and automatically handles experimental counterbalancing (Latin Square),
data logging, and CSV exporting.

FILE STRUCTURE

The project consists of three core files:

index.html  - The main structure and UI layout. Loads WebGazer.js.

style.css   - Styling for the simulated PDF, sidebar, and gaze visuals.

script.js   - The application logic, including:

GazeController (WebGazer integration & smoothing)

VoiceController (Web Speech API logic)

Experiment Manager (Latin Square generation, trial state)

HOW TO RUN (CRITICAL)

Due to browser security restrictions regarding Webcam (Eye-tracking) and
Microphone (Voice) access, this project CANNOT be run by simply double-
clicking index.html (the file:// protocol).

You must run it on a local web server (http://localhost) or over HTTPS.

Option A: Using Python (Recommended)

Open your terminal/command prompt.

Navigate to the folder containing these files.

Run: python -m http.server

Open your browser to: http://localhost:8000

Option B: VS Code Live Server

Install the "Live Server" extension in Visual Studio Code.

Right-click index.html and select "Open with Live Server".

Browser Requirement: Google Chrome is required for the Web Speech API.

EXPERIMENTAL DESIGN & CONFIGURATION

The system comes pre-configured with the following experimental design:

A. Independent Variables (Factors):

Context (3 Levels): Desktop, Supine (Lying Down), Dual-Task (Gym).

Technique (2 Levels): Baseline (Manual), Multimodal (Gaze/Voice).

B. Counterbalancing (Latin Square):
The system automatically groups trials by "Context" to minimize physical
setup changes for the participant.

The order of Contexts rotates based on the Participant ID (P1, P2, P3...).

The order of Techniques is randomized within each Context block.

C. Trials:

Default is 1 trial per unique condition combination.

Total: 3 Contexts * 2 Techniques = 6 Trials per participant.

INTERACTION GUIDE

A. Eye-Tracking (Multimodal Mode Only)

Calibration: Before the trial starts, a 5-point calibration overlay
appears. The user MUST click the red dots while looking at them.

Scrolling: Looking at the top 15% of the screen scrolls UP. Looking
at the bottom 15% scrolls DOWN. The center 70% is a stable reading zone.

Visual Feedback: A red translucent dot shows the estimated gaze point.

B. Voice Annotation (Multimodal Mode Only)

Click "Start Recording" (or the Mic icon).

Speak your note clearly.

The system uses Speech-to-Text to transcribe the note and pin it
to the sidebar.

C. Manual Annotation (Baseline Mode)

Type in the text box.

Click "Add Note".

DATA LOGGING (CSV EXPORT)

Upon completing all trials, click "Export" to download a CSV file.

Columns Generated:

Participant: ID entered at start.

Trial: Sequential trial number (1-6).

Context: The physical environment condition.

Technique: The interaction mode used.

Duration: Time taken to complete the trial (seconds).

Corrections: Number of times the user had to reverse scroll direction
(a measure of navigation error/overshoot).

TranscriptLen: Total characters of annotations generated.

TROUBLESHOOTING

Issue: "Webcam access denied"

Solution: Ensure you are on http://localhost or https://. Check browser
permissions icon in the URL bar.

Issue: "Speech API not supported"

Solution: Use Google Chrome. Safari and Firefox have limited support.

Issue: Gaze dot is jittery

Solution: Ensure good lighting on the user's face. Avoid backlighting
(windows behind the user).

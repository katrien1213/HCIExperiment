/* MERGED LOGIC FILE
    PART A: Experiment Controller (Skeleton)
    PART B: PDF & Eye Tracking Logic (The Core)
*/

// =========================================================
// PART A: EXPERIMENT CONTROLLER & STATE
// =========================================================

const EXP = {
    participant: '',
    schedule: [],
    currentTrialIdx: -1,
    results: [],
    startTime: 0,
    isRunning: false,
    
    // UI Elements
    views: {
        setup: document.getElementById('setup-view'),
        run: document.getElementById('experiment-view')
    },
    labels: {
        counter: document.getElementById('trial-counter'),
        tech: document.getElementById('current-technique'),
        context: document.getElementById('current-context'),
        instr: document.getElementById('instruction-text')
    },
    buttons: {
        finish: document.getElementById('finishTrialBtn')
    }
};

// 1. Generate Schedule
document.getElementById('generateBtn').addEventListener('click', () => {
    const pID = document.getElementById('participant').value;
    const trialsPer = parseInt(document.getElementById('trialsPer').value);
    
    // Hardcoded Factors for your specific design
    const contexts = ['Desktop', 'Supine', 'Dual-Task'];
    const techniques = ['Multimodal', 'Baseline'];
    
    let rawSchedule = [];
    contexts.forEach(ctx => {
        techniques.forEach(tech => {
            for(let i=0; i<trialsPer; i++) {
                rawSchedule.push({ Context: ctx, Technique: tech, Rep: i+1 });
            }
        });
    });

    // Simple Shuffle
    EXP.schedule = rawSchedule.sort(() => Math.random() - 0.5);
    EXP.participant = pID;
    
    document.getElementById('schedule-preview').textContent = `Generated ${EXP.schedule.length} trials. PDF Loaded: ${!!PDF_SYSTEM.pdfDoc}`;
    
    // Enable Start only if PDF is loaded
    if(PDF_SYSTEM.pdfDoc) {
        document.getElementById('startExpBtn').disabled = false;
    } else {
        alert("Please Upload a PDF first.");
    }
});

// 2. Start Experiment
document.getElementById('startExpBtn').addEventListener('click', () => {
    EXP.views.setup.classList.remove('active');
    EXP.views.run.classList.add('active');
    EXP.isRunning = true;
    runTrial(0);
});

// 3. Run Specific Trial
function runTrial(index) {
    if(index >= EXP.schedule.length) {
        endExperiment();
        return;
    }

    EXP.currentTrialIdx = index;
    const trial = EXP.schedule[index];
    
    // Update UI
    EXP.labels.counter.textContent = `Trial ${index+1} / ${EXP.schedule.length}`;
    EXP.labels.tech.textContent = trial.Technique;
    EXP.labels.context.textContent = trial.Context;
    
    // SETUP THE SYSTEM BASED ON CONDITION
    const isMultimodal = (trial.Technique === 'Multimodal');
    
    if(isMultimodal) {
        EXP.labels.instr.innerHTML = "<b>Mode: Multimodal</b><br>Eye tracking scrolling is ACTIVE.<br>Voice notes are ACTIVE (Continuous).";
        PDF_SYSTEM.enableEyeTracking(true);
        PDF_SYSTEM.enableVoice(true);
        document.getElementById('voice-controls').style.display = 'block';
    } else {
        EXP.labels.instr.innerHTML = "<b>Mode: Baseline</b><br>Use Mouse to scroll.<br>Eye tracking is OFF.<br>Manual notes only.";
        PDF_SYSTEM.enableEyeTracking(false);
        PDF_SYSTEM.enableVoice(false);
        document.getElementById('voice-controls').style.display = 'none';
    }

    // Clear previous notes
    document.getElementById('notes-list').innerHTML = '';
    EXP.startTime = Date.now();
}

// 4. Finish Trial
EXP.buttons.finish.addEventListener('click', () => {
    const endTime = Date.now();
    const trial = EXP.schedule[EXP.currentTrialIdx];
    
    // Harvest Notes
    const notes = Array.from(document.querySelectorAll('.sticky-note p')).map(p => p.innerText);
    
    EXP.results.push({
        Participant: EXP.participant,
        Trial: EXP.currentTrialIdx + 1,
        Context: trial.Context,
        Technique: trial.Technique,
        DurationMS: endTime - EXP.startTime,
        NotesCount: notes.length,
        NotesContent: notes.join(' | ')
    });

    runTrial(EXP.currentTrialIdx + 1);
});

function endExperiment() {
    // Export CSV
    const headers = Object.keys(EXP.results[0]);
    const csv = [headers.join(',')]
        .concat(EXP.results.map(r => headers.map(k => `"${r[k]}"`).join(',')))
        .join('\n');
    
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${EXP.participant}_results.csv`;
    document.body.appendChild(a);
    a.click();
    
    alert("Experiment Complete! Data downloaded.");
    location.reload();
}

// =========================================================
// PART B: PDF & EYE TRACKING LOGIC (Your Logic)
// =========================================================

const PDF_SYSTEM = {
    pdfDoc: null,
    isEyeTrackingActive: false,
    isVoiceActive: false,
    
    // Parameters
    GAZE_BUFFER_SIZE: 12,
    gazeBufferX: [],
    gazeBufferY: [],
    SCROLL_UP_THRESHOLD: 0.2,
    SCROLL_DOWN_THRESHOLD: 0.8,
    SCROLL_SPEED_PX: 4,
    SCROLL_INTENT_FRAMES: 10,
    consecutiveFramesInScrollZone: 0,
    scrollInterval: null,
    
    // Initialization
    enableEyeTracking: function(enable) {
        this.isEyeTrackingActive = enable;
        const dot = document.getElementById('webgazerGazeDot');
        
        if(enable) {
            webgazer.resume();
            webgazer.showPredictionPoints(true); 
            if(dot) dot.style.display = 'block';
        } else {
            webgazer.pause(); // Pause processing to save CPU
            webgazer.showPredictionPoints(false);
            if(dot) dot.style.display = 'none';
            this.stopGradualScroll();
        }
    },
    
    enableVoice: function(enable) {
        // Reset Voice UI
        const btn = document.getElementById('recordBtn');
        const status = document.getElementById('recording-status');
        
        if(VOICE_SYSTEM.recognition) VOICE_SYSTEM.recognition.abort(); // Stop previous
        
        if(enable) {
            VOICE_SYSTEM.isVoiceDesired = false; // Wait for user click
            btn.classList.remove('recording');
            btn.innerHTML = '🎤 Start Voice Notes';
            status.textContent = 'Voice-to-text Ready';
        } else {
            VOICE_SYSTEM.isVoiceDesired = false;
        }
    },

    stopGradualScroll: function() {
        if (this.scrollInterval) {
            cancelAnimationFrame(this.scrollInterval.id);
            this.scrollInterval = null;
        }
    }
};

// --- PDF LOADING ---
document.getElementById('pdfFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const fileReader = new FileReader();
        fileReader.onload = async function () {
            const typedArray = new Uint8Array(this.result);
            PDF_SYSTEM.pdfDoc = await pdfjsLib.getDocument(typedArray).promise;
            
            const container = document.getElementById('pdf-container');
            container.innerHTML = '';
            
            // Render all pages
            for (let i = 1; i <= PDF_SYSTEM.pdfDoc.numPages; i++) {
                renderPage(i);
            }
            document.getElementById('pdf-status').textContent = '✅ PDF Loaded Successfully';
            // Enable generate if not already
        };
        fileReader.readAsArrayBuffer(file);
    }
});

async function renderPage(num) {
    const page = await PDF_SYSTEM.pdfDoc.getPage(num);
    const scale = 1.5;
    const viewport = page.getViewport({ scale: scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    
    // Text Layer
    const textContent = await page.getTextContent();
    const textLayerDiv = document.createElement('div');
    textLayerDiv.className = 'textLayer';
    textLayerDiv.style.width = canvas.width + 'px';
    textLayerDiv.style.height = canvas.height + 'px';

    pdfjsLib.renderTextLayer({
        textContent: textContent,
        container: textLayerDiv,
        viewport: viewport,
        textDivs: []
    });

    // Bionic Reading Logic
    applyBionicReading(textLayerDiv);

    const pageWrapper = document.createElement('div');
    pageWrapper.style.position = 'relative';
    pageWrapper.appendChild(canvas);
    pageWrapper.appendChild(textLayerDiv);
    document.getElementById('pdf-container').appendChild(pageWrapper);
}

function applyBionicReading(textLayerDiv) {
    const spans = textLayerDiv.querySelectorAll('span');
    spans.forEach(span => {
        let text = span.textContent;
        if (!text || text.trim() === '') return;
        const boldLength = Math.max(1, Math.ceil(text.length * 0.4));
        span.innerHTML = `<b style="font-weight: 800;">${text.substring(0, boldLength)}</b>${text.substring(boldLength)}`;
    });
}

// --- CALIBRATION LOGIC ---
document.getElementById('calibrateBtn').addEventListener('click', () => {
    document.getElementById('calib-status').textContent = 'Starting Webcam...';
    
    webgazer.setGazeListener(gazeListener)
             .saveDataAcrossSessions(true)
             .begin()
             .then(() => {
                document.getElementById('calib-status').textContent = 'Webcam ON. Running Routine...';
                runCalibrationRoutine();
             })
             .catch(e => alert("Webcam Error: " + e));
});

async function runCalibrationRoutine() {
    webgazer.showPredictionPoints(false);
    const target = document.createElement('div');
    target.id = 'calibrationTarget';
    document.body.appendChild(target);
    target.style.display = 'block';

    const points = [{x:50,y:50}, {x:10,y:10}, {x:90,y:10}, {x:10,y:90}, {x:90,y:90}];
    
    for (let i = 0; i < points.length; i++) {
        const x = window.innerWidth * (points[i].x / 100);
        const y = window.innerHeight * (points[i].y / 100);
        target.style.left = (x-10)+'px';
        target.style.top = (y-10)+'px';
        await new Promise(r => setTimeout(r, 1500));
        webgazer.recordScreenPosition(x, y, 'click'); 
        await new Promise(r => setTimeout(r, 500));
    }
    
    target.style.display = 'none';
    document.getElementById('calib-status').textContent = '✅ Calibrated & Ready';
    webgazer.pause(); // Pause until experiment starts
}

// --- CORE EYE TRACKING LOOP ---
function gazeListener(data, elapsedTime) {
    // Only process if enabled by Experiment Controller
    if (!data || !PDF_SYSTEM.isEyeTrackingActive) return;

    // 1. Smooth Data
    PDF_SYSTEM.gazeBufferX.push(data.x);
    PDF_SYSTEM.gazeBufferY.push(data.y);
    if (PDF_SYSTEM.gazeBufferX.length > PDF_SYSTEM.GAZE_BUFFER_SIZE) {
        PDF_SYSTEM.gazeBufferX.shift();
        PDF_SYSTEM.gazeBufferY.shift();
    }
    const avgX = PDF_SYSTEM.gazeBufferX.reduce((a,b)=>a+b,0) / PDF_SYSTEM.gazeBufferX.length;
    const avgY = PDF_SYSTEM.gazeBufferY.reduce((a,b)=>a+b,0) / PDF_SYSTEM.gazeBufferY.length;

    // 2. Visual Dot
    const dot = document.getElementById('webgazerGazeDot');
    if(dot) {
         dot.style.left = (avgX-5) + 'px';
         dot.style.top = (avgY-5) + 'px';
    }

    // 3. Scroll Logic
    const viewportHeight = window.innerHeight;
    const normalizedY = avgY / viewportHeight;
    const inUp = normalizedY < PDF_SYSTEM.SCROLL_UP_THRESHOLD;
    const inDown = normalizedY > PDF_SYSTEM.SCROLL_DOWN_THRESHOLD;

    if (inUp || inDown) {
        PDF_SYSTEM.consecutiveFramesInScrollZone++;
    } else {
        PDF_SYSTEM.consecutiveFramesInScrollZone = 0;
        PDF_SYSTEM.stopGradualScroll();
        return;
    }

    if (PDF_SYSTEM.consecutiveFramesInScrollZone > PDF_SYSTEM.SCROLL_INTENT_FRAMES) {
        const speed = PDF_SYSTEM.SCROLL_SPEED_PX;
        const container = document.getElementById('pdf-container');
        
        if (inUp) startScroll(-speed, container);
        else if (inDown) startScroll(speed, container);
    }
}

function startScroll(speed, container) {
    if (PDF_SYSTEM.scrollInterval && PDF_SYSTEM.scrollInterval.speed === speed) return;
    PDF_SYSTEM.stopGradualScroll();
    
    function animate() {
        if (PDF_SYSTEM.scrollInterval) {
            container.scrollTop += speed;
            PDF_SYSTEM.scrollInterval.id = requestAnimationFrame(animate);
        }
    }
    PDF_SYSTEM.scrollInterval = { id: requestAnimationFrame(animate), speed: speed };
}

// =========================================================
// PART C: VOICE SYSTEM (Continuous)
// =========================================================

const VOICE_SYSTEM = {
    recognition: null,
    isVoiceDesired: false, // User toggle state
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    VOICE_SYSTEM.recognition = new SpeechRecognition();
    VOICE_SYSTEM.recognition.continuous = true;
    VOICE_SYSTEM.recognition.interimResults = true;
    VOICE_SYSTEM.recognition.lang = 'en-US';

    VOICE_SYSTEM.recognition.onresult = (event) => {
        let finalTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTrans += event.results[i][0].transcript;
        }
        if (finalTrans.length > 0) {
            addNoteToUI(finalTrans, true);
        }
    };
    
    // Auto-restart if active
    VOICE_SYSTEM.recognition.onend = () => {
        if(VOICE_SYSTEM.isVoiceDesired && PDF_SYSTEM.isEyeTrackingActive) {
            try { VOICE_SYSTEM.recognition.start(); } catch(e){}
        } else {
            document.getElementById('recordBtn').classList.remove('recording');
        }
    };
}

// Button Listener
document.getElementById('recordBtn').addEventListener('click', () => {
    if(!VOICE_SYSTEM.recognition) return;
    
    VOICE_SYSTEM.isVoiceDesired = !VOICE_SYSTEM.isVoiceDesired;
    const btn = document.getElementById('recordBtn');
    const status = document.getElementById('recording-status');
    
    if(VOICE_SYSTEM.isVoiceDesired) {
        VOICE_SYSTEM.recognition.start();
        btn.classList.add('recording');
        btn.innerHTML = '🔴 Listening...';
        status.textContent = 'Speak continuously...';
    } else {
        VOICE_SYSTEM.recognition.stop();
        btn.classList.remove('recording');
        btn.innerHTML = '🎤 Start Voice Notes';
        status.textContent = 'Paused.';
    }
});

function addNoteToUI(text, isVoice) {
    const list = document.getElementById('notes-list');
    const note = document.createElement('div');
    note.className = 'sticky-note';
    if(isVoice) note.style.borderLeft = "5px solid #28a745";
    
    const time = new Date().toLocaleTimeString();
    note.innerHTML = `
        <button class="note-delete" onclick="this.parentElement.remove()">×</button>
        <div style="color:#666; font-size:0.7em;">${time}</div>
        <div>${isVoice ? '🎤 ' : ''}${text}</div>
    `;
    list.prepend(note);
}
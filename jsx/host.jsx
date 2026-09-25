// Sequence Rotate - ExtendScript host side
// Returns pipe-delimited strings: "OK|name|width|height" or "ERR|message"

function sr_info() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return "ERR|No active sequence";
        var s = seq.getSettings();
        return "OK|" + seq.name + "|" + s.videoFrameWidth + "|" + s.videoFrameHeight +
               "|" + (sr_fillActive(seq) ? "F" : "-");
    } catch (e) {
        return "ERR|" + e.toString();
    }
}

function sr_rotate() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return "ERR|No active sequence";
        var s = seq.getSettings();
        var w = s.videoFrameWidth, h = s.videoFrameHeight;
        if (w === h) return "ERR|Sequence is square - nothing to rotate";

        s.videoFrameWidth = h;
        s.videoFrameHeight = w;

        // Keep the Video Previews size in step with the frame size
        var pw = s.previewFrameWidth, ph = s.previewFrameHeight;
        if (pw && ph) {
            s.previewFrameWidth = ph;
            s.previewFrameHeight = pw;
        }

        seq.setSettings(s);
        return sr_info();
    } catch (e) {
        return "ERR|" + e.toString();
    }
}

// ---------- Fill to frame ----------
// Sets Motion > Scale on every video clip so it covers the whole frame (no bars).
// Returns "FILL|changed|skipped|reasons"

function sr_clipSize(projectItem) {
    // Source frame size comes from the project metadata's Video Info column, e.g. "1920 x 1080 (1.0)"
    try {
        var md = projectItem.getProjectMetadata();
        var m = md.match(/VideoInfo>\s*(\d+)\s*x\s*(\d+)(?:\s*\(([\d.]+)\))?/);
        if (!m) return null;
        var par = m[3] ? parseFloat(m[3]) : 1;
        return { w: parseInt(m[1], 10) * (par || 1), h: parseInt(m[2], 10) };
    } catch (e) { return null; }
}

function sr_motion(clip) {
    var comps = clip.components;
    for (var i = 0; i < comps.numItems; i++) {
        var c = comps[i];
        if (c.matchName === "AE.ADBE Motion" || c.displayName === "Motion") return c;
    }
    return null;
}

function sr_prop(comp, name, index) {
    var p = comp.properties;
    for (var i = 0; i < p.numItems; i++) if (p[i].displayName === name) return p[i];
    return p.numItems > index ? p[index] : null;
}

// Fill state per sequence, kept while Premiere is running:
// SR_FILL[sequenceID] = [{ id, prev, prevW, set }]
var SR_FILL = {};

function sr_clipId(clip, t) {
    try { if (clip.nodeId) return String(clip.nodeId); } catch (e) {}
    return t + ":" + clip.start.ticks;
}

function sr_findClip(seq, id) {
    for (var t = 0; t < seq.videoTracks.numTracks; t++) {
        var clips = seq.videoTracks[t].clips;
        for (var c = 0; c < clips.numItems; c++)
            if (sr_clipId(clips[c], t) === id) return clips[c];
    }
    return null;
}

function sr_near(a, b) { return Math.abs(a - b) < 0.01; }

// Filled = we have a record and at least one clip still has the scale we set
function sr_fillActive(seq) {
    var rec = SR_FILL[seq.sequenceID];
    if (!rec || !rec.length) return false;
    for (var i = 0; i < rec.length && i < 3; i++) {
        var clip = sr_findClip(seq, rec[i].id);
        var m = clip ? sr_motion(clip) : null;
        var sc = m ? sr_prop(m, "Scale", 1) : null;
        try { if (sc && sr_near(sc.getValue(), rec[i].set)) return true; } catch (e) {}
    }
    delete SR_FILL[seq.sequenceID];
    return false;
}

// One button: fills if not filled, restores previous scales if filled
function sr_fill() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return "ERR|No active sequence";
        return sr_fillActive(seq) ? sr_unfill(seq) : sr_doFill(seq);
    } catch (e) {
        return "ERR|" + e.toString();
    }
}

function sr_unfill(seq) {
    var rec = SR_FILL[seq.sequenceID], restored = 0, skipped = 0;
    for (var i = 0; i < rec.length; i++) {
        var r = rec[i];
        var clip = sr_findClip(seq, r.id);
        var motion = clip ? sr_motion(clip) : null;
        var scale = motion ? sr_prop(motion, "Scale", 1) : null;
        // Only restore clips still at the filled value - leave anything you've changed since
        if (!scale || !sr_near(scale.getValue(), r.set)) { skipped++; continue; }
        scale.setValue(r.prev, true);
        var sw = sr_prop(motion, "Scale Width", 2);
        try { if (sw && r.prevW !== null && sr_near(sw.getValue(), r.set)) sw.setValue(r.prevW, true); } catch (e) {}
        restored++;
    }
    delete SR_FILL[seq.sequenceID];
    return "UNFILL|" + restored + "|" + skipped;
}

function sr_doFill(seq) {
    var s = seq.getSettings();
    var fw = s.videoFrameWidth, fh = s.videoFrameHeight;
    var changed = 0, skipped = 0, keyframed = 0, locked = 0, rec = [];

    for (var t = 0; t < seq.videoTracks.numTracks; t++) {
        var track = seq.videoTracks[t];
        try { if (track.isLocked && track.isLocked()) { locked += track.clips.numItems; continue; } } catch (e) {}
        for (var c = 0; c < track.clips.numItems; c++) {
            var clip = track.clips[c];
            var size = clip.projectItem ? sr_clipSize(clip.projectItem) : null;
            var motion = size ? sr_motion(clip) : null;
            var scale = motion ? sr_prop(motion, "Scale", 1) : null;
            if (!scale) { skipped++; continue; }
            if (scale.isTimeVarying && scale.isTimeVarying()) { keyframed++; continue; }

            var pct = Math.max(fw / size.w, fh / size.h) * 100;
            pct = Math.ceil(pct * 100) / 100; // round up so no hairline edge shows

            var r = { id: sr_clipId(clip, t), prev: scale.getValue(), prevW: null, set: pct };
            scale.setValue(pct, true);
            // If Uniform Scale is off, Scale is height only - set width to match
            var uni = sr_prop(motion, "Uniform Scale", 3);
            var sw = sr_prop(motion, "Scale Width", 2);
            try { if (uni && !uni.getValue() && sw) { r.prevW = sw.getValue(); sw.setValue(pct, true); } } catch (e) {}
            rec.push(r);
            changed++;
        }
    }
    if (rec.length) SR_FILL[seq.sequenceID] = rec;
    return "FILL|" + changed + "|" + (skipped + keyframed + locked) +
           "|" + skipped + "|" + keyframed + "|" + locked;
}

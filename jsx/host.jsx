// Sequence Rotate - ExtendScript host side
// Returns pipe-delimited strings: "OK|name|width|height" or "ERR|message"

function sr_info() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return "ERR|No active sequence";
        var s = seq.getSettings();
        return "OK|" + seq.name + "|" + s.videoFrameWidth + "|" + s.videoFrameHeight;
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

function sr_fill() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return "ERR|No active sequence";
        var s = seq.getSettings();
        var fw = s.videoFrameWidth, fh = s.videoFrameHeight;
        var changed = 0, skipped = 0, keyframed = 0, locked = 0;

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

                scale.setValue(pct, true);
                // If Uniform Scale is off, Scale is height only - set width to match
                var uni = sr_prop(motion, "Uniform Scale", 3);
                var sw = sr_prop(motion, "Scale Width", 2);
                try { if (uni && !uni.getValue() && sw) sw.setValue(pct, true); } catch (e) {}
                changed++;
            }
        }
        return "FILL|" + changed + "|" + (skipped + keyframed + locked) +
               "|" + skipped + "|" + keyframed + "|" + locked;
    } catch (e) {
        return "ERR|" + e.toString();
    }
}

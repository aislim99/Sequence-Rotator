SEQ. ROTATE - Premiere Pro extension
====================================

A small panel for Premiere Pro with two buttons:

  [Rotate]  Swaps the active sequence between vertical and horizontal,
            keeping the same dimensions (1920x1080 <-> 1080x1920,
            3840x2160 <-> 2160x3840). Video preview size is swapped too.

  [Fill]    Scales every video clip in the active sequence so it fills
            the frame with no black bars (Motion > Scale).
            Click again (button is lit blue) to put every clip back to
            the scale it had before.

Works with Premiere Pro 2021 (v15) and later.


INSTALL (macOS)
---------------
1. Unzip this folder.
2. Double-click "install.command".
   - If macOS says it can't be opened because it's from an unidentified
     developer: right-click the file > Open > Open.
     (Or: System Settings > Privacy & Security > scroll down > "Open Anyway".)
3. Quit Premiere Pro completely and reopen it.
4. Window > Extensions > Seq. Rotate.
5. Dock the panel wherever you like, then save your workspace
   (Window > Workspaces > Save as New Workspace / Save Changes).

The installer copies the extension to:
  ~/Library/Application Support/Adobe/CEP/extensions/SequenceRotate
and turns on "PlayerDebugMode", which Premiere needs to load extensions
that aren't from the Adobe marketplace.


INSTALL MANUALLY (macOS) - if install.command won't run
-------------------------------------------------------
1. In Finder press Cmd+Shift+G and go to:
     ~/Library/Application Support/Adobe/CEP/extensions/
   (Create the "CEP" and "extensions" folders if they don't exist.)
2. Copy the whole "SequenceRotate" folder into it.
3. Open Terminal and paste this line, then press Return:
     for v in 9 10 11 12 13; do defaults write com.adobe.CSXS.$v PlayerDebugMode 1; done
4. Restart Premiere Pro.


INSTALL (Windows)
-----------------
1. Copy the "SequenceRotate" folder to:
     C:\Users\<your name>\AppData\Roaming\Adobe\CEP\extensions\
   (AppData is hidden - paste %APPDATA%\Adobe\CEP\extensions into the
   File Explorer address bar. Create the folders if missing.)
2. Open Command Prompt and run each line:
     reg add HKCU\Software\Adobe\CSXS.11 /v PlayerDebugMode /t REG_SZ /d 1 /f
     reg add HKCU\Software\Adobe\CSXS.12 /v PlayerDebugMode /t REG_SZ /d 1 /f
     reg add HKCU\Software\Adobe\CSXS.13 /v PlayerDebugMode /t REG_SZ /d 1 /f
3. Restart Premiere Pro.


UPDATING
--------
Run install.command from the new zip - it overwrites the old version.
Then quit and reopen Premiere Pro.


USING IT
--------
- The panel always works on the sequence open in the Timeline.
- Rotate is greyed out for square sequences.
- After rotating, clips keep their current scale - press Fill to make them
  cover the new frame.
- Fill skips: clips with Scale keyframes, clips on locked tracks, and
  items with no frame size (titles, adjustment layers, etc.).
  A short message in the panel shows how many were filled/skipped.
- Fill doesn't move clips (Position is left alone).
- Undoing a Fill: click the Fill button again while it's lit blue - all
  clips go back to their previous scale in one click. Clips you've
  re-scaled by hand since the Fill are left alone.
  (Cmd+Z also works, but Premiere counts each clip as a separate step.)
- The Fill toggle remembers one Fill per sequence until you quit
  Premiere or close/reopen the panel.
- The layout adapts to the panel size: make it tall to put the size
  under the buttons, short to keep everything on one row.


TROUBLESHOOTING
---------------
"Seq. Rotate" isn't in Window > Extensions
  - Quit Premiere fully (Cmd+Q) and reopen - it only scans on launch.
  - Check the folder is in the right place and is named SequenceRotate,
    with CSXS, jsx, index.html and main.js directly inside it (not inside
    a second SequenceRotate folder).
  - PlayerDebugMode may not have stuck. Run the Terminal line from
    "Install manually" step 3, then run:  killall cfprefsd
    and restart Premiere.
  - Very new Premiere versions may use a newer CSXS number. If it still
    doesn't show, run the same line with 14 and 15 added:
      for v in 9 10 11 12 13 14 15; do defaults write com.adobe.CSXS.$v PlayerDebugMode 1; done

The panel opens but is blank
  - Close the panel and reopen it from Window > Extensions.
  - Reinstall, then restart Premiere.

Panel says "No active sequence"
  - Click in the Timeline or open a sequence. The panel checks once a second.

Rotate/Fill does nothing
  - Make sure the sequence isn't mid-render or in a modal dialog
    (e.g. Sequence Settings open). Close dialogs and try again.

Fill leaves black bars or overshoots
  - If a clip has "Scale to Frame Size" turned on (right-click clip),
    turn it off and press Fill again.
  - Clips with Scale keyframes are skipped on purpose.

Panel content is cut off when docked very small
  - Premiere doesn't shrink extension panels below a certain width; it
    crops them instead. Content is anchored to the left so the buttons
    stay visible.
  - If it still looks wrong: close the panel, reopen it from
    Window > Extensions, re-dock it and re-save your workspace
    (workspaces remember old panel sizes).

Panel name still shows the old name ("Sequence Rotate")
  - Close the panel, reopen from Window > Extensions > Seq. Rotate,
    re-dock and re-save your workspace.


UNINSTALL
---------
Delete the folder:
  ~/Library/Application Support/Adobe/CEP/extensions/SequenceRotate
(Windows: %APPDATA%\Adobe\CEP\extensions\SequenceRotate)
then restart Premiere Pro.

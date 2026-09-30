#!/bin/bash
# record-backup.sh <deck url with #/slide> <out.mp4> [max seconds]
#
# Records a backup video of a live slide, the way Marcin Wichary keeps a screencast behind anything
# that talks to a server. Opens the slide in a clean, fullscreen, app-mode Chrome (no tabs, no
# omnibox), counts down, records the screen at 60 fps while you run the demo by hand, stops when
# you press Enter (or at the max), then crops to the 16:9 stage and encodes:
#   <out>.mp4  H.264, 1920 wide, 60 fps      <out>.jpg  poster from the first frame
# Point the slide's <Live backup={{ src, poster }}> at the two files.
set -u
URL=$1; OUT=${2%.mp4}; MAX=${3:-600}
PROFILE=/tmp/stevenote-record-profile
RAW=/tmp/stevenote-record-raw.mov
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

pkill -f "user-data-dir=$PROFILE" 2>/dev/null; sleep 1
rm -rf "$PROFILE" "$RAW"
( "$CHROME" --user-data-dir="$PROFILE" --no-first-run --no-default-browser-check --disable-sync --disable-extensions \
    --start-fullscreen --autoplay-policy=no-user-gesture-required --app="$URL" > /dev/null 2>&1 & )
sleep 5
echo "Recording in 3…"; sleep 1; echo "2…"; sleep 1; echo "1…"; sleep 1
screencapture -v -V "$MAX" "$RAW" &
SC=$!
echo "Recording. Run the demo in the Chrome window. Press Enter here to stop."
read -r _
kill -INT $SC 2>/dev/null; wait $SC 2>/dev/null; sleep 1
pkill -f "user-data-dir=$PROFILE" 2>/dev/null

# Crop to the 16:9 stage letterboxed in the middle of the screen, then encode.
read -r W H < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$RAW" | tr ',' ' ')
CW=$(python3 -c "w,h=$W,$H; print(min(w, h*16//9))")
CH=$(python3 -c "w,h=$W,$H; print(min(h, w*9//16))")
CX=$(( (W - CW) / 2 )); CY=$(( (H - CH) / 2 ))
ffmpeg -y -v error -i "$RAW" -vf "crop=$CW:$CH:$CX:$CY,scale=1920:-2,fps=60" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart -an "$OUT.mp4"
ffmpeg -y -v error -i "$OUT.mp4" -frames:v 1 -q:v 2 "$OUT.jpg"
rm -f "$RAW"
echo "Wrote $OUT.mp4 and $OUT.jpg"

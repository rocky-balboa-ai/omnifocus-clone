#!/bin/bash
# Auto-restarting Claude Code runner
# Runs independently of Clawdbot sessions

cd ~/Projects/omnifocus-clone
LOG_FILE="/tmp/claude-code.log"

echo "$(date): Starting Claude Code runner..." >> $LOG_FILE

while true; do
    echo "$(date): Starting Claude Code session..." >> $LOG_FILE
    
    # Run Claude Code with resume flag
    claude --dangerously-skip-permissions --resume 2>&1 | tee -a $LOG_FILE
    
    EXIT_CODE=$?
    echo "$(date): Claude Code exited with code $EXIT_CODE" >> $LOG_FILE
    
    # If it exited cleanly (user quit), don't restart
    if [ $EXIT_CODE -eq 0 ]; then
        echo "$(date): Clean exit, not restarting." >> $LOG_FILE
        break
    fi
    
    echo "$(date): Restarting in 5 seconds..." >> $LOG_FILE
    sleep 5
done

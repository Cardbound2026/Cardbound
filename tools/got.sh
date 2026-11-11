# got.sh key blobid [key blobid ...] -> records finished card art
D=/tmp/claude-0/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/scratchpad/cards
while [ $# -ge 2 ]; do echo "$1 /root/.claude/projects/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/tool-results/mcp-remote-devices-blob-$2.png" >> $D/done.tsv; shift 2; done
wc -l < $D/done.tsv

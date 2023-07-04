#!/bin/bash
# @author webworker01

if [ "$#" -lt 3 ]; then
    echo "KNOMP pool block notify"
    echo "usage: $0 <host:port> <coin> <block>"
    exit 1
fi

host=$(echo "$1" | cut -d ':' -f 1)
port=$(echo "$1" | cut -d ':' -f 2)
coin="$2"
block="$3"
sendline="{\"command\":\"blocknotify\",\"params\":[\"$coin\",\"$block\"]}"

exec 3<>/dev/tcp/$host/$port

if [ $? -ne 0 ]; then
    echo "Failed to connect to $host:$port"
    exit 1
fi

echo -ne "$sendline\n" >&3
exec 3>&-

if [ $? -ne 0 ]; then
    echo "Error sending data"
    exit 1
fi

exit 0

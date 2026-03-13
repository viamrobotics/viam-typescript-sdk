#!/bin/bash
set -euo pipefail

failed=""
for dir in examples/*/; do
	if [ -f "$dir/tsconfig.json" ]; then
		echo "Type-checking $dir..."
		install_out=$(cd "$dir" && npm install 2>&1)
		if [ $? -ne 0 ]; then
			echo "$dir npm install failed:"
			echo "$install_out" | grep -A2 "npm error" | head -20
			failed="$failed $dir"
			continue
		fi
		tsc_out=$(cd "$dir" && npx tsc --noEmit --pretty 2>&1)
		if [ $? -ne 0 ]; then
			echo "$tsc_out" | sed "s|^|$dir|"
			failed="$failed $dir"
		fi
	fi
done

if [ -n "$failed" ]; then
	echo ""
	echo "========================================"
	echo "ERROR: Your changes have broken example code."
	echo "Failed examples:$failed"
	echo "Please fix the type errors above."
	echo "========================================"
	exit 1
fi

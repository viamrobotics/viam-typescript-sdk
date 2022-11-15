PATH_WITH_TOOLS="`pwd`/node_modules/.bin:${PATH}"

buf:
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/googleapis/googleapis
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/viamrobotics/api --path common,component,robot,service
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/erdaniels/gostream
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/viamrobotics/goutils
	npm ci --audit=false
	PATH=$(PATH_WITH_TOOLS) cat etc/rollup_files.txt | xargs -n1 -P32 npm run rollup

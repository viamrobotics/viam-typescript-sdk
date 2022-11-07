PATH_WITH_TOOLS="`pwd`/node_modules/.bin:${PATH}"

buf:
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/viamrobotics/api --path common,component,robot,service
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/viamrobotics/goutils

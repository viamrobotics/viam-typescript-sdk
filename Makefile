node_modules := $(shell npm root)
buf := npm exec --offline -- buf

# common targets

.PHONY: all
all: clean build lint test

.PHONY: setup
setup:  $(node_modules)

.PHONY: teardown
teardown:
	rm -rf node_modules

.PHONY: build
build: build-buf build-js build-docs

.PHONY: clean
clean: clean-js clean-buf clean-docs

.PHONY: test
test: $(node_modules) build-buf
	npm run test

.PHONY: test-watch
test-watch: $(node_modules) build-buf
	npm run test:watch

.PHONY: lint
lint: $(node_modules) build-buf
	npm run lint
	npm run typecheck
	npm run check -- --reject="@bufbuild/protobuf,@connectrpc/connect,@connectrpc/connect-web"

.PHONY: format
format: $(node_modules)
	npm run format

# development dependencies

$(node_modules): package-lock.json
	npm ci --audit=false

# protobuf targets

.PHONY: clean-buf
clean-buf:
	rm -rf src/gen

.PHONY: update-buf
update-buf: $(node_modules)
	$(buf) mod update

.PHONY: build-buf
build-buf: $(node_modules) clean-buf
	$(buf) generate buf.build/googleapis/googleapis
	$(buf) generate buf.build/opentelemetry/opentelemetry
	$(buf) generate buf.build/viamrobotics/api:$$(cat api_version.lock) --path common,component,robot,service,app,provisioning,tagger,stream
	$(buf) generate buf.build/viamrobotics/goutils
	$(buf) generate buf.build/grpc/grpc --path grpc/reflection/v1/reflection.proto

# js targets

.PHONY: clean-js
clean-js:
	rm -rf dist

.PHONY: build-js
build-js: $(node_modules) clean-js build-buf
	npm run build

# build and create a tarball from a package - useful for local testing,
# inspecting what is included in the final distribution, and local publishing.
.PHONY: pack
pack: build
	npm pack

# bump to the next pre-release version on the `next` distribution tag -
# run this command if you need to publish an off-cycle release of the sdk
.PHONY: bump-next-version
bump-next-version:
	npm version --no-git-tag-version prerelease --preid=next

# docs targets

.PHONY: clean-docs
clean-docs:
	rm -rf docs/dist

.PHONY: build-docs
build-docs: clean-docs build-buf
	npm run doc

# e2e tests

.PHONY: install-playwright
install-playwright:
	npm run e2e:browser-install

e2e/bin/viam-server:
	bash e2e/setup.sh

.PHONY: test-e2e
test-e2e: e2e/bin/viam-server install-playwright
	npm run e2e:browser
	npm run e2e:node

.PHONY: test-e2e-node
test-e2e-node: e2e/bin/viam-server 
	npm run e2e:node

.PHONY: test-e2e-browser
test-e2e-browser: e2e/bin/viam-server install-playwright
	npm run e2e:browser

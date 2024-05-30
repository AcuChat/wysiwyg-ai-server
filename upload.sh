#!/bin/bash
rsync -a --exclude "node_modules" . root@michaelcalvinwood.net:/home/wysiwyg-ai-server/

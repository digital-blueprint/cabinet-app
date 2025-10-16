# Use `just <recipe>` to run a recipe
# https://just.systems/man/en/

import ".shared/common.just"
import ".shared/dbp-app.just"

# By default, run the `--list` command
default:
    @just --list

# Variables

zellijSession := "cabinet-app"

# Interactive npm watch script selector for watching cabinet only
[group('dev')]
watch-cabinet:
    APP_ACTIVITIES=dbp-cabinet-search just watch

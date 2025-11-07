{
  # More config is provided by input shared
  enterShell = ''
    echo "🛠️ DBP Cabinet App Dev Shell"
  '';

  # https://devenv.sh/git-hooks/
  git-hooks = {
    hooks = {
      # Try i18next with "env TERM=dumb"
      i18next.enable = true;

      i18next2 = {
        enable = false;
        name = "i18next2";
        description = "Check translations with i18next-cli";
        # If we try this without --dry-run then the hook hangs with high cpu load
        # entry = "npx i18next-cli lint";
        # entry = "npm run check";
        # entry = "eza";
        # entry = "sh -c \"npx i18next-cli extract --ci --dry-run 2>&1 | tee /tmp/i18next.log\"";
        # entry = "sh -c \"npx i18next-cli extract --ci\"";
        # entry = "timeout 10 sh -c \"npx i18next-cli extract --ci --dry-run; exit $?\"";
        # entry = "timeout 10 sh -c \"./node_modules/.bin/i18next-cli extract --ci < /dev/null; exit $?\"";
        # entry = "node ./node_modules/.bin/i18next-cli extract --ci";
        entry = "/nix/store/gydp4lzvfnhirnqdbd4fab24hwvskxhb-i18next-cli-1.20.4/bin/i18next-cli extract --ci";
        # entry = "extract-translations";
        # always_run = true;
        language = "system";
        pass_filenames = false;
        files = "(src/.*\\.js$|translation\\.json$)";
        stages = [ "pre-commit" ];
        require_serial = true;
        verbose = true;
      };
    };
  };

  #  scripts = {
  #    check.exec = "i18next-cli lint";
  #    extract-translations.exec = "i18next-cli extract --ci";
  #  };
  #
  #  tasks = {
  #    "i18next:lint" = {
  #      description = "Run i18next-cli lint to check translations";
  #      exec = ''
  #        npx i18next-cli lint
  #      '';
  #      # before = [ "devenv:git-hooks:run" ];
  #    };
  #    "i18next:extract" = {
  #      description = "Run i18next-cli extract to extract new translations";
  #      execIfModified = [
  #        "src/**/*.js"
  #        "translation.json"
  #      ];
  #      exec = ''
  #        npx i18next-cli extract
  #      '';
  #      # after = [ "devenv:git-hooks:run" ];
  #      before = [ "devenv:git-hooks:run" ];
  #      # before = [ "devenv:pre-commit:after" ];
  #    };
  #  };
}

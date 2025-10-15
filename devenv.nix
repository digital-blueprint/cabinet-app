{
  pkgs,
  ...
}:

{
  # More config is provided by input shared
  enterShell = ''
    echo "🛠️ DBP Cabinet App Dev Shell"
  '';

  # Pre-commit hooks
  git-hooks.hooks = {
    i18next = {
      # Don't enable yet, since seems to run forever as git-hook
      enable = false;
      name = "i18next";
      description = "Check translations with i18next-cli";
      entry = "${pkgs.nodejs_24}/bin/npx i18next-cli extract --ci --dry-run";
      language = "system";
      pass_filenames = false;
      files = "(src/.*\\.js$|translation\\.json$)";
      stages = [ "pre-commit" ];
    };
  };
}

{
  description = "A development shell for the project";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in
    {
      devShells."${system}".default =
        with import nixpkgs { system = "x86_64-linux"; };
        mkShell {
          packages = with pkgs; [
            nodejs_20
            curl
            zellij # smart terminal workspace
            lazygit # git terminal
            just # task runner
            fzf # fuzzy finder, for "just watch"
          ];
        };
    };
}

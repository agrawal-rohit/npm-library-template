const fs = require("fs");
const inquirer = require("inquirer");
const execSync = require("child_process").execSync;

const getGitUsername = () => {
  try {
    return execSync("git config user.name").toString().trim();
  } catch (error) {
    console.error(
      "Error getting git username. Please ensure git is correctly configured.",
      error
    );
    process.exit(1);
  }
};

const getGitEmail = () => {
  try {
    return execSync("git config user.email").toString().trim();
  } catch (error) {
    console.error(
      "Error getting git email. Please ensure git is correctly configured.",
      error
    );
    process.exit(1);
  }
};

const gitUsername = getGitUsername();
const gitEmail = getGitEmail();

inquirer
  .prompt([
    {
      type: "input",
      name: "library-name",
      message: "Library name (as seen on NPM):",
    },
    {
      type: "input",
      name: "library-description",
      message: "Library description:",
    },
    {
      type: "confirm",
      name: "is-react-library",
      message: "Is this a ReactJS library?",
      default: false,
    },
  ])
  .then((answers) => {
    //* Update package.json
    const packageJsonPath = "./package.json";
    fs.readFile(packageJsonPath, (err, data) => {
      if (err) throw err;
      const packageJson = JSON.parse(data);
      packageJson.name = answers["library-name"];
      packageJson.description = answers["library-description"];
      packageJson.author = `${gitUsername} <${gitEmail}>`;

      if (answers["is-react-library"]) {
        packageJson.peerDependencies = {
          react: ">=18",
          "react-dom": ">=18",
        };

        packageJson.devDependencies["@testing-library/jest-dom"] = "^6.2.0";
        packageJson.devDependencies["@testing-library/react"] = "^14.1.2";
        packageJson.devDependencies["@types/react"] = "^18.2.48";
        packageJson.devDependencies["@types/react-dom"] = "^18.2.18";
        packageJson.devDependencies["eslint-plugin-react"] = "^7.33.2";
        packageJson.devDependencies["eslint-plugin-react-hooks"] = "^4.6.0";
        packageJson.devDependencies.react = "^18.2.0";
        packageJson.devDependencies["react-dom"] = "^18.2.0";
      }

      fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2),
        (err) => {
          if (err) throw err;
        }
      );
    });

    //* Update Code of Conduct
    const cocPath = "./CODE_OF_CONDUCT.md";
    fs.readFile(cocPath, "utf8", (err, data) => {
      if (err) throw err;
      const updatedData = data.replaceAll("<contact-email>", gitEmail);

      fs.writeFile(cocPath, updatedData, "utf8", (err) => {
        if (err) throw err;
      });
    });

    //* Update README
    const readmeTemplatePath = "./README.template.md";
    fs.readFile(readmeTemplatePath, "utf8", (err, data) => {
      if (err) throw err;
      let updatedData = data.replaceAll(
        "<library-name>",
        answers["library-name"]
      );
      updatedData = updatedData.replaceAll(
        "<library-description>",
        answers["library-description"]
      );

      fs.writeFile(readmeTemplatePath, updatedData, "utf8", (err) => {
        if (err) throw err;

        //* Delete current README.md
        const readmePath = "./README.md";
        fs.unlink(readmePath, (err) => {
          if (err) throw err;

          //* Rename README.template.md to README.md
          fs.rename(readmeTemplatePath, readmePath, (err) => {
            if (err) throw err;
          });
        });
      });
    });
  });

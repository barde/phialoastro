# Update File Structure Plan

## 1. Findings

Based on the analysis of the repository, here are the key findings regarding the current file structure:

*   **Monorepo Structure:** The repository is a monorepo containing three main projects: `phialo-design` (the Astro-based frontend), `workers` (Cloudflare Workers for deployment), and `ci` (Docker-based CI infrastructure).
*   **Redundancy and Inconsistency:** There's a significant amount of redundant and inconsistent documentation. For example, there are multiple `README.md` files with overlapping information, and several documents describe the project structure in different ways.
*   **Scattered Documentation:** Documentation is scattered across the root `docs` directory, `phialo-design/docs`, and `ci/docs`. This makes it difficult to find information and maintain consistency.
*   **Organic Growth:** The project structure shows signs of organic growth, with some architectural decisions documented in multiple places and some inconsistencies in naming conventions.
*   **Good CI/CD Integration:** The `ci` directory and associated GitHub Actions workflows demonstrate a robust and well-documented CI/CD pipeline.

## 2. High-Level Goals

The primary goals of this file structure update are to:

*   **Consolidate and Simplify:** Create a single source of truth for documentation and project structure.
*   **Improve Navigability:** Make it easier for developers to find the information they need.
*   **Reduce Redundancy:** Eliminate duplicate and conflicting information.
*   **Establish Clear Conventions:** Define and document clear conventions for file organization and naming.

## 3. Proposed File Structure

Here is the proposed file structure that addresses the findings and goals:

```
phialoastro/
├── .github/                # GitHub specific files (no changes)
├── ci/                     # CI/CD infrastructure (no changes)
├── docs/                   # Consolidated documentation
│   ├── README.md             # Overview of the documentation
│   ├── architecture/
│   │   ├── README.md
│   │   ├── project-structure.md
│   │   ├── ci-cd-pipeline.md
│   │   └── workers-deployment.md
│   ├── decisions/            # Architectural Decision Records (ADRs)
│   │   ├── README.md
│   │   ├── ADR-001-astro-and-react.md
│   │   ├── ADR-002-cloudflare-workers-migration.md
│   │   └── ...
│   ├── how-to/
│   │   ├── README.md
│   │   ├── local-development-setup.md
│   │   ├── running-tests.md
│   │   └── deployment.md
│   └── contributing.md
├── phialo-design/          # Main application (no major changes to src)
│   ├── src/
│   ├── public/
│   ├── tests/
│   ├── package.json
│   └── README.md             # Specific to phialo-design
├── scripts/                # Utility scripts (no changes)
├── workers/                  # Cloudflare Workers (no major changes to src)
│   ├── src/
│   ├── package.json
│   └── README.md             # Specific to workers
├── .gitignore
├── LICENSE.md
├── README.md                 # Root README - high-level overview
└── UPDATE_FILE_STRUCTURE_PLAN.md # This file
```

## 4. Detailed Plan

### 4.1. Consolidate Documentation

*   **Action:** Move all documentation from `phialo-design/docs` and `ci/docs` to the root `docs` directory.
*   **Rationale:** Creates a single, centralized location for all project documentation, making it easier to find and maintain.

### 4.2. Restructure `docs` Directory

*   **Action:** Organize the `docs` directory into the following sections: `architecture`, `decisions`, and `how-to`.
*   **Rationale:** This structure, inspired by the Diátaxis framework, separates documentation by its purpose, making it more intuitive to navigate.

### 4.3. Create a Root `README.md`

*   **Action:** Create a new `README.md` at the root of the project that provides a high-level overview of the monorepo, its projects, and links to the relevant documentation.
*   **Rationale:** This will serve as the main entry point for anyone new to the project.

### 4.4. Update Project-Specific `README.md` Files

*   **Action:** Update the `README.md` files in `phialo-design` and `workers` to be specific to those projects, removing any information that is now in the root `docs`.
*   **Rationale:** This will make the project-specific READMEs more concise and focused.

### 4.5. Consolidate AI Assistant Instructions

*   **Action:** Move the contents of `CLAUDE.md`, `CLAUDE.local.md`, and `.github/copilot-instructions.md` into a `.claude` directory.
*   **Rationale:** This will group all AI-related instructions in one place.

## 5. Implementation Steps

1.  **Create the new `docs` directory structure.**
2.  **Move and rename existing documentation files** to their new locations in the `docs` directory.
3.  **Rewrite the root `README.md`** to provide a high-level overview of the project.
4.  **Update the `phialo-design/README.md` and `workers/README.md`** to be more focused.
5.  **Create the `.claude` directory and move the AI assistant instructions.**
6.  **Delete the old `phialo-design/docs` and `ci/docs` directories.**
7.  **Review and update all links** in the documentation to reflect the new structure.

This plan will result in a more organized, maintainable, and user-friendly repository structure.

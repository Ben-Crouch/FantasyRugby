# 🤝 Contributing to Fantasy Rugby

Thank you for your interest in contributing to the Fantasy Rugby project! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## 📜 Code of Conduct

This project follows a code of conduct that we expect all contributors to follow:

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome contributors from all backgrounds
- **Be constructive**: Provide helpful feedback and suggestions
- **Be patient**: Remember that everyone is learning and growing

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Python 3.8+** (3.13 recommended)
- **Node.js 16+** (18+ recommended)
- **PostgreSQL 12+** (14+ recommended)
- **Git** for version control
- **Databricks account** (for data access)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/FantasyRugby.git
   cd FantasyRugby
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/Ben-Crouch/FantasyRugby.git
   ```

## 🛠 Development Setup

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install pytest pytest-django black flake8 coverage

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver 8000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Install development dependencies
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event

# Create environment file
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env

# Start development server
npm start
```

## 📝 Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes**: Fix existing issues
- **Feature additions**: Add new functionality
- **Documentation**: Improve or add documentation
- **Testing**: Add or improve tests
- **Performance**: Optimize existing code
- **UI/UX**: Improve user interface and experience

### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes**:
   - Write clean, readable code
   - Follow the coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   # Backend tests
   cd backend
   python manage.py test
   
   # Frontend tests
   cd frontend
   npm test
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## 🔄 Pull Request Process

### Before Submitting

- [ ] **Code follows style guidelines**
- [ ] **Self-review completed**
- [ ] **Tests pass locally**
- [ ] **Documentation updated**
- [ ] **No merge conflicts**

### Pull Request Template

When creating a PR, please include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No merge conflicts
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** on staging environment
4. **Approval** from at least one maintainer
5. **Merge** to main branch

## 📏 Coding Standards

### Python (Backend)

- **PEP 8** style guide
- **Black** for code formatting
- **Flake8** for linting
- **Type hints** for function signatures
- **Docstrings** for all functions and classes

```python
def example_function(param1: str, param2: int) -> bool:
    """
    Example function with proper documentation.
    
    Args:
        param1: Description of parameter
        param2: Description of parameter
        
    Returns:
        Description of return value
    """
    return True
```

### JavaScript (Frontend)

- **ESLint** configuration
- **Prettier** for code formatting
- **Functional components** with hooks
- **PropTypes** for type checking
- **JSDoc** comments for functions

```javascript
/**
 * Example React component
 * @param {Object} props - Component props
 * @param {string} props.title - Component title
 * @param {Function} props.onClick - Click handler
 * @returns {JSX.Element} Rendered component
 */
const ExampleComponent = ({ title, onClick }) => {
  return <div onClick={onClick}>{title}</div>;
};
```

### Git Commit Messages

Follow the **Conventional Commits** specification:

```
type(scope): description

feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

Examples:
- `feat(auth): add JWT token refresh`
- `fix(api): resolve league creation error`
- `docs(readme): update installation instructions`

## 🧪 Testing

### Backend Testing

```bash
# Run all tests
python manage.py test

# Run specific test
python manage.py test fantasy.tests.test_views

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

### Frontend Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Test Requirements

- **Unit tests** for all new functions
- **Integration tests** for API endpoints
- **Component tests** for React components
- **E2E tests** for critical user flows

## 📚 Documentation

### Code Documentation

- **Docstrings** for all Python functions and classes
- **JSDoc** comments for JavaScript functions
- **Inline comments** for complex logic
- **README updates** for new features

### API Documentation

- **Endpoint descriptions** in `API_DOCUMENTATION.md`
- **Request/response examples**
- **Error code documentation**
- **Authentication requirements**

### User Documentation

- **Setup instructions** in `README.md`
- **Deployment guide** in `DEPLOYMENT_GUIDE.md`
- **Contributing guidelines** in `CONTRIBUTING.md`
- **Code examples** and tutorials

## 🐛 Issue Reporting

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check if it's already fixed** in the latest version
3. **Gather information** about the problem

### Issue Template

```markdown
## Bug Report

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Ubuntu 20.04]
- Python: [e.g. 3.13]
- Node.js: [e.g. 18.17.0]
- Browser: [e.g. Chrome 91]

**Additional context**
Any other context about the problem.
```

### Feature Request Template

```markdown
## Feature Request

**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## 🏷️ Release Process

### Version Numbering

We follow **Semantic Versioning** (SemVer):

- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] **All tests pass**
- [ ] **Documentation updated**
- [ ] **Version numbers updated**
- [ ] **Changelog updated**
- [ ] **Release notes prepared**
- [ ] **Deployment tested**

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code reviews and discussions

### Resources

- **Documentation**: Check the README and API docs
- **Code Examples**: Look at existing code
- **Community**: Join discussions and ask questions

## 🙏 Recognition

Contributors will be recognized in:

- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to Fantasy Rugby! 🏉**

**Last Updated**: September 2025  
**Version**: 1.0.0  
**Maintainer**: Roland Crouch

# GrainChain Spends Frontend

A modern React application for managing payment requests and expense classification in the GrainChain ecosystem.

## 🚀 Features

- **Payment Request Management**: Create, view, edit, and track payment requests
- **Expense Classification**: Intelligent expense splitting and categorization
- **Role-Based Access**: Support for multiple user roles (Executor, Registrar, Sub-Registrar, Distributor, Treasurer, Admin)
- **Real-time Updates**: Live data synchronization with backend services
- **Advanced UI**: Modern interface built with Tailwind CSS and Radix UI components
- **Type Safety**: Full TypeScript support with strict type checking
- **Performance Optimized**: React Query for data fetching and caching

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Notifications**: Sonner

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── common/         # Shared components
│   ├── ui/            # Base UI components
│   ├── auth/          # Authentication components
│   ├── registrar/     # Registrar-specific components
│   ├── sub-registrar/ # Sub-registrar components
│   ├── distributor/   # Distributor components
│   ├── treasurer/     # Treasurer components
│   └── admin/         # Admin components
├── hooks/             # Custom React hooks
├── services/          # API service layer
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── context/          # React context providers
└── providers/        # App providers (Query, etc.)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Update the environment variables with your backend API URL.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## 🏗️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style

This project follows strict coding standards:

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Configured with React and TypeScript rules
- **Prettier**: Code formatting (if configured)
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Imports**: Absolute imports using path aliases

### Component Guidelines

1. **Use TypeScript**: All components must be typed
2. **Memoization**: Use `React.memo` for expensive components
3. **Hooks**: Use custom hooks for reusable logic
4. **Props**: Document all props with JSDoc comments
5. **Accessibility**: Include proper ARIA attributes

### API Integration

- Use the service layer in `src/services/` for all API calls
- Implement React Query hooks for data fetching
- Handle loading and error states appropriately
- Use optimistic updates where appropriate

## 🧪 Testing

### Running Tests

```bash
npm run test
```

### Test Coverage

- Unit tests for utility functions
- Component rendering tests
- Hook behavior tests
- Integration tests for API services

## 📦 Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## 🔧 Configuration

### Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version

### Path Aliases

Configured in `vite.config.ts`:
- `@/*` - `src/*`
- `@components/*` - `src/components/*`
- `@services/*` - `src/services/*`
- `@types` - `src/types/index.ts`
- `@hooks/*` - `src/hooks/*`
- `@utils/*` - `src/utils/*`

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**: Check TypeScript errors with `npm run type-check`
2. **Import Errors**: Verify path aliases are correctly configured
3. **API Errors**: Check network tab and backend service status
4. **Performance Issues**: Use React DevTools Profiler to identify bottlenecks

### Debug Mode

Enable debug logging by setting `localStorage.setItem('debug', 'true')` in browser console.

## 🤝 Contributing

1. Follow the established code style
2. Write tests for new features
3. Update documentation as needed
4. Ensure all checks pass before submitting

## 📄 License

This project is part of the GrainChain ecosystem and is proprietary software.

## 🔗 Related Documentation

- [API Documentation](../docs/API_TECHNICAL_DOCS.md)
- [User Guide](../docs/USER_GUIDE.md)
- [Developer Guide](../docs/DEVELOPER_GUIDE.md)
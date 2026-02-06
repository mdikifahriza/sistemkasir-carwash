Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops. 

1/2

Next.js 16.1.6
Turbopack
Console Error



The result of getServerSnapshot should be cached to avoid an infinite loop
src/app/(dashboard)/layout.tsx (19:64) @ DashboardLayout


  17 |   const hydrated = useHydrated();
  18 |   const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
> 19 |   const { isReady, isLoading, error, bootstrap } = useDataStore((state) => ({
     |                                                                ^
  20 |     isReady: state.isReady,
  21 |     isLoading: state.isLoading,
  22 |     error: state.error,
Call Stack
21

Show 20 ignore-listed frame(s)
DashboardLayout
src/app/(dashboard)/layout.tsx (19:64)
1
2
Was this helpful

  # GrainChain Spends

  This is a code bundle for GrainChain Spends. The original project is available at https://www.figma.com/design/aazojPTvpRsLjuBDWhfD4s/GrainChain-Spends.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  

  services/
├── httpClient.ts              # Base HTTP client and configuration
├── paymentRequestService.ts   # Payment request operations
├── dictionaryApiService.ts    # Dictionary API operations
├── paymentRegisterService.ts  # Payment register operations
├── userService.ts            # User management operations
├── fileService.ts            # File upload/download operations
├── distributorService.ts     # Distributor routing operations
├── statisticsService.ts      # Statistics and metrics (existing)
├── index.ts                  # Main services export
├── MIGRATION_GUIDE.md        # Migration documentation
└── dictionaries/             # Dictionary system (existing)
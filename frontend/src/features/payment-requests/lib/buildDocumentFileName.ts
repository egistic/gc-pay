/**
 * Document file name generation utility
 * Creates consistent file names based on document properties
 */

/**
 * Build a standardized document file name
 * @param input - Object containing document properties
 * @returns Generated file name
 */
export const buildDocumentFileName = (input: {
  docType: string;
  docNumber: string;
  docDate: string;
  payingCompany: string;
  counterpartyName: string;
}): string => {
  const { docType, docNumber, docDate, payingCompany, counterpartyName } = input;

  // Format date for filename (YYYY-MM-DD)
  const formatDateForFilename = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'unknown-date';
      }
      return date.toISOString().split('T')[0];
    } catch {
      return 'unknown-date';
    }
  };

  // Clean string for filename (remove special characters)
  const cleanString = (str: string): string => {
    return str
      .replace(/[^a-zA-Z0-9а-яА-Я\s-]/g, '') // Keep only alphanumeric, spaces, and hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  };

  const formattedDate = formatDateForFilename(docDate);
  const cleanDocType = cleanString(docType);
  const cleanDocNumber = cleanString(docNumber);
  const cleanPayingCompany = cleanString(payingCompany);
  const cleanCounterpartyName = cleanString(counterpartyName);

  // Build filename: DocType_DocNumber_Date_PayingCompany_Counterparty
  const parts = [
    cleanDocType,
    cleanDocNumber,
    formattedDate,
    cleanPayingCompany,
    cleanCounterpartyName
  ].filter(Boolean);

  return parts.join('_') + '.pdf';
};

/**
 * Build a simple file name for basic documents
 * @param docType - Document type
 * @param docNumber - Document number
 * @param docDate - Document date
 * @returns Generated file name
 */
export const buildSimpleDocumentFileName = (
  docType: string,
  docNumber: string,
  docDate: string
): string => {
  return buildDocumentFileName({
    docType,
    docNumber,
    docDate,
    payingCompany: '',
    counterpartyName: ''
  });
};

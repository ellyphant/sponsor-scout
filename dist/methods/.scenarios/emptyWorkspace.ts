export async function emptyWorkspace() {
  // The scenario runner clears database rows. No services, stores, auth writes or mail.
  return { message: 'Empty workspace. Configure connections or add a sponsor to begin.' };
}

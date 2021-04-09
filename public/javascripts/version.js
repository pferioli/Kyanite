async function getCurrentVersion(depositId) {

    const response = await fetch('/check_version');

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    return await response.json();
}
function sanitzeJSONResponseObjects(input) {
    const firstBraceIndex = input.indexOf('{');
    const lastBraceIndex = input.lastIndexOf('}');

    if (firstBraceIndex === -1 || lastBraceIndex === -1 || firstBraceIndex >= lastBraceIndex) {
        return '';
    }

    return input.substring(firstBraceIndex, lastBraceIndex + 1);
}

module.exports = { sanitzeJSONResponseObjects };
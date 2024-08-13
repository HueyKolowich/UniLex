function formatGMTDate(GMTDateString) {
    if (!GMTDateString || GMTDateString === "NA") {
        return { date: "", time: "" };
    }

    const date = new Date(GMTDateString);

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');

    return { date: `${month}/${day}/${year}`, time: `${formattedHours}:${minutes} ${ampm}` };
};

export default formatGMTDate;
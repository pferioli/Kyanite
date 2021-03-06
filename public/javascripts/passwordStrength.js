/*
Password Strength Algorithm:

Password Length:
    5 Points: Less than 4 characters
    10 Points: 5 to 7 characters
    25 Points: 8 or more

Letters:
    0 Points: No letters
    10 Points: Letters are all lower case
    20 Points: Letters are upper case and lower case

Numbers:
    0 Points: No numbers
    10 Points: 1 number
    20 Points: 3 or more numbers

Characters:
    0 Points: No characters
    10 Points: 1 character
    25 Points: More than 1 character

Bonus:
    2 Points: Letters and numbers
    3 Points: Letters, numbers, and characters
    5 Points: Mixed case letters, numbers, and characters

Password Text Range:

    >= 90: Very Secure
    >= 80: Secure
    >= 70: Very Strong
    >= 60: Strong
    >= 50: Average
    >= 25: Weak
    >= 0: Very Weak
*/

var m_strUpperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var m_strLowerCase = "abcdefghijklmnopqrstuvwxyz";
var m_strNumber = "0123456789";
var m_strCharacters = "!@#$%^&*?_~"

function checkPassword(strPassword) {
    // Reset combination count
    var nScore = 0;

    // Password length
    // -- Less than 4 characters
    if (strPassword.length < 5) {
        nScore += 5;
    }
    // -- 5 to 7 characters
    else if (strPassword.length > 4 && strPassword.length < 8) {
        nScore += 10;
    }
    // -- 8 or more
    else if (strPassword.length > 7) {
        nScore += 25;
    }

    // Letters
    var nUpperCount = countContain(strPassword, m_strUpperCase);
    var nLowerCount = countContain(strPassword, m_strLowerCase);
    var nLowerUpperCount = nUpperCount + nLowerCount;
    // -- Letters are all lower case
    if (nUpperCount == 0 && nLowerCount != 0) {
        nScore += 10;
    }
    // -- Letters are upper case and lower case
    else if (nUpperCount != 0 && nLowerCount != 0) {
        nScore += 20;
    }

    // Numbers
    var nNumberCount = countContain(strPassword, m_strNumber);
    // -- 1 number
    if (nNumberCount == 1) {
        nScore += 10;
    }
    // -- 3 or more numbers
    if (nNumberCount >= 3) {
        nScore += 20;
    }

    // Characters
    var nCharacterCount = countContain(strPassword, m_strCharacters);
    // -- 1 character
    if (nCharacterCount == 1) {
        nScore += 10;
    }
    // -- More than 1 character
    if (nCharacterCount > 1) {
        nScore += 25;
    }

    // Bonus
    // -- Letters and numbers
    if (nNumberCount != 0 && nLowerUpperCount != 0) {
        nScore += 2;
    }
    // -- Letters, numbers, and characters
    if (nNumberCount != 0 && nLowerUpperCount != 0 && nCharacterCount != 0) {
        nScore += 3;
    }
    // -- Mixed case letters, numbers, and characters
    if (nNumberCount != 0 && nUpperCount != 0 && nLowerCount != 0 && nCharacterCount != 0) {
        nScore += 5;
    }


    return nScore;
}

// Runs password through check and then updates GUI 

function runPassword(strPassword, strFieldID) {
    // Check password
    var nScore = checkPassword(strPassword);

    // Get controls
    var ctlText = document.getElementById(strFieldID);
    if (!ctlText)        //if (!ctlBar || !ctlText)
        return;

    // Set new width
    //ctlBar.style.width = (nScore * 1.25 > 100) ? 100 : nScore * 1.25 + "%";

    // Color and text
    // -- Very Secure
    /*if (nScore >= 90)
    {
        var strText = "Very Secure";
        var strColor = "#0ca908";
    }
    // -- Secure
    else if (nScore >= 80)
    {
        var strText = "Secure";
        vstrColor = "#7ff67c";
    }
    // -- Very Strong
    else 
    */
    if (nScore >= 80) {
        var strText = "Muy Segura";
        var strColor = "#388e3c";
        var strScore = "veryStrong";
    }
    // -- Strong
    else if (nScore >= 60) {
        var strText = "Segura";
        var strColor = "#006000";
        var strScore = "strong";
    }
    // -- Average
    else if (nScore >= 40) {
        var strText = "Normal";
        var strColor = "#e3cb00";
        var strScore = "average";
    }
    // -- Weak
    else if (nScore >= 20) {
        var strText = "Débil";
        var strColor = "#Fe3d1a";
        var strScore = "weak";
    }
    // -- Very Weak
    else {
        var strText = "Muy Débil";
        var strColor = "#e71a1a";
        var strScore = "veryWeak";
    }

    if (strPassword.length == 0) {
        ctlText.style.color = "";
        ctlText.innerHTML = "";
        strScore = "noPassword";
    }
    else {
        ctlText.style.color = strColor;
        ctlText.innerHTML = strText;
    }

    return strScore;
}

// Checks a string for a list of characters
function countContain(strPassword, strCheck) {
    // Declare variables
    var nCount = 0;

    for (i = 0; i < strPassword.length; i++) {
        if (strCheck.indexOf(strPassword.charAt(i)) > -1) {
            nCount++;
        }
    }

    return nCount;
} 
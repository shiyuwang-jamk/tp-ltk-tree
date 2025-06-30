# Written by Github Copilot.

import pandas as pd

# 1. Read the main data file that needs to be updated
main_df = pd.read_csv('tree-api.csv')

# 2. Read the lookup file that contains the TDOI information
tdoi_lookup_df = pd.read_csv('tdoi-drg.csv')

# 3. Select only the necessary columns from the lookup file: the key ('ID') and the value ('TDOI')
tdoi_subset = tdoi_lookup_df[['ID', 'TDOI']]

# If the main DataFrame already has a 'TDOI' column, drop it to avoid conflicts
if 'TDOI' in main_df.columns:
    main_df = main_df.drop(columns=['TDOI'])

# 4. Perform a 'left merge'. This keeps all rows from main_df and adds the 'TDOI' column
# from our subset where the 'ID' matches. No suffixes are needed.
merged_df = pd.merge(main_df, tdoi_subset, on='ID', how='left')

# 5. Define a function to format the TDOI column correctly.
def format_tdoi(value):
    # Check if the value is a valid number (not NaN)
    if pd.notna(value):
        # Convert float to integer, then format as a 5-digit string with leading zeros
        return f'{int(value):05d}'
    # If the value is NaN (i.e., no match was found), return an empty string
    return ''

# Apply the custom formatting function to the 'TDOI' column.
# This function correctly handles both numbers and the original NaN values.
merged_df['TDOI'] = merged_df['TDOI'].apply(format_tdoi)

# 6. Save the final, completed result to a new CSV file
merged_df.to_csv('tree-api-with-tdoi.csv', index=False)

print("Success! New file created at tree-api-with-tdoi.csv")
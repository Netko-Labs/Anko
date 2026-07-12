import type { SqlSnippet } from '../types'

export const SQL_SNIPPETS: SqlSnippet[] = [
  {
    label: 'sel',
    template: 'SELECT * FROM ',
    description: 'Select all columns from a table',
  },
  {
    label: 'selc',
    template: 'SELECT  FROM  WHERE ',
    description: 'Select specific columns with a condition',
  },
  {
    label: 'selj',
    template: 'SELECT * FROM  INNER JOIN  ON ',
    description: 'Select with an inner join',
  },
  {
    label: 'sellj',
    template: 'SELECT * FROM  LEFT JOIN  ON ',
    description: 'Select with a left join',
  },
  {
    label: 'ins',
    template: 'INSERT INTO  () VALUES ()',
    description: 'Insert a row into a table',
  },
  {
    label: 'upd',
    template: 'UPDATE  SET  WHERE ',
    description: 'Update rows in a table',
  },
  {
    label: 'del',
    template: 'DELETE FROM  WHERE ',
    description: 'Delete rows from a table',
  },
  {
    label: 'cret',
    template: 'CREATE TABLE  (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  \n)',
    description: 'Create a new table',
  },
  {
    label: 'altt',
    template: 'ALTER TABLE  ADD COLUMN ',
    description: 'Add a column to a table',
  },
  {
    label: 'crei',
    template: 'CREATE INDEX  ON  ()',
    description: 'Create an index',
  },
  {
    label: 'grp',
    template: 'SELECT , COUNT(*) FROM  GROUP BY  HAVING COUNT(*) > ',
    description: 'Group by with count and having clause',
  },
  {
    label: 'ord',
    template: 'ORDER BY  DESC',
    description: 'Order by descending',
  },
  {
    label: 'lim',
    template: 'LIMIT  OFFSET ',
    description: 'Limit with offset for pagination',
  },
  {
    label: 'case',
    template: 'CASE WHEN  THEN  ELSE  END',
    description: 'Case expression',
  },
  {
    label: 'cte',
    template: 'WITH  AS (\n  SELECT * FROM \n)\nSELECT * FROM ',
    description: 'Common Table Expression (CTE)',
  },
  {
    label: 'exist',
    template: 'WHERE EXISTS (SELECT 1 FROM  WHERE )',
    description: 'Exists subquery',
  },
  {
    label: 'notexist',
    template: 'WHERE NOT EXISTS (SELECT 1 FROM  WHERE )',
    description: 'Not exists subquery',
  },
  {
    label: 'union',
    template: 'SELECT * FROM \nUNION ALL\nSELECT * FROM ',
    description: 'Union two queries',
  },
]

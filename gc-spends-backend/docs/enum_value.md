           enum_name            |      enum_value      | sort_order 
---------------------------------+----------------------+------------
 contract_type                   | GENERAL              |          1
 contract_type                   | EXPORT               |          2
 contract_type                   | SERVICE              |          3
 contract_type                   | SUPPLY               |          4
 distribution_status             | PENDING              |          1
 distribution_status             | IN_PROGRESS          |          2
 distribution_status             | COMPLETED            |          3
 distribution_status             | FAILED               |          4
 document_status                 | REQUIRED             |          1
 document_status                 | UPLOADED             |          2
 document_status                 | VERIFIED             |          3
 document_status                 | REJECTED             |          4
 payment_priority                | LOW                  |          1
 payment_priority                | NORMAL               |          2
 payment_priority                | HIGH                 |          3
 payment_priority                | URGENT               |          4
 payment_priority                | CRITICAL             |          5
 payment_request_status          | DRAFT                |          1
 payment_request_status          | SUBMITTED            |          2
 payment_request_status          | UNDER_REVIEW         |          3
 payment_request_status          | APPROVED             |          4
 payment_request_status          | REJECTED             |          5
 payment_request_status          | PAID                 |          6
 payment_request_status          | CANCELLED            |          7
 payment_request_status          | CLASSIFIED           |          8
 payment_request_status          | ALLOCATED            |          9
 payment_request_status          | RETURNED             |         10
 payment_request_status          | APPROVED-ON-BEHALF   |         11
 payment_request_status          | TO-PAY               |         12
 payment_request_status          | IN-REGISTER          |         13
 payment_request_status          | APPROVED-FOR-PAYMENT |         14
 payment_request_status          | PAID-FULL            |         15
 payment_request_status          | PAID-PARTIAL         |         16
 payment_request_status          | DECLINED             |         17
 payment_request_status          | DISTRIBUTED          |         18
 payment_request_status          | REPORT_PUBLISHED     |         19
 payment_request_status          | EXPORT_LINKED        |         20
 paymentpriority                 | LOW                  |          1
 paymentpriority                 | NORMAL               |          2
 paymentpriority                 | HIGH                 |          3
 paymentpriority                 | URGENT               |          4
 paymentpriority                 | CRITICAL             |          5
 sub_registrar_assignment_status | ASSIGNED             |          1
 sub_registrar_assignment_status | IN_PROGRESS          |          2
 sub_registrar_assignment_status | COMPLETED            |          3
 sub_registrar_assignment_status | REJECTED             |          4


        table_name         |     column_name     |            enum_type            |  data_type   
---------------------------+---------------------+---------------------------------+--------------
 contracts                 | contract_type       | contract_type                   | USER-DEFINED
 payment_requests          | distribution_status | distribution_status             | USER-DEFINED
 payment_requests          | priority            | paymentpriority                 | USER-DEFINED
 payment_requests          | status              | payment_request_status          | USER-DEFINED
 sub_registrar_assignments | status              | sub_registrar_assignment_status | USER-DEFINED
 sub_registrar_reports     | document_status     | document_status                 | USER-DEFINED



            enum_name            | value_count |                                                                                                             
         all_values                                                                                                                      
---------------------------------+-------------+-------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------------------------------
 contract_type                   |           4 | GENERAL, EXPORT, SERVICE, SUPPLY
 distribution_status             |           4 | PENDING, IN_PROGRESS, COMPLETED, FAILED
 document_status                 |           4 | REQUIRED, UPLOADED, VERIFIED, REJECTED
 payment_priority                |           5 | LOW, NORMAL, HIGH, URGENT, CRITICAL
 payment_request_status          |          20 | DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, PAID, CANCELLED, CLASSIFIED, ALLOCATED, RETURNED, APPROV
ED-ON-BEHALF, TO-PAY, IN-REGISTER, APPROVED-FOR-PAYMENT, PAID-FULL, PAID-PARTIAL, DECLINED, DISTRIBUTED, REPORT_PUBLISHED, EXPORT_LINKED
 paymentpriority                 |           5 | LOW, NORMAL, HIGH, URGENT, CRITICAL
 sub_registrar_assignment_status |           4 | ASSIGNED, IN_PROGRESS, COMPLETED, REJECTED
(7 rows)



        value         | order 
----------------------+-------
 DRAFT                |     1
 SUBMITTED            |     2
 UNDER_REVIEW         |     3
 APPROVED             |     4
 REJECTED             |     5
 PAID                 |     6
 CANCELLED            |     7
 CLASSIFIED           |     8
 ALLOCATED            |     9
 RETURNED             |    10
 APPROVED-ON-BEHALF   |    11
 TO-PAY               |    12
 IN-REGISTER          |    13
 APPROVED-FOR-PAYMENT |    14
 PAID-FULL            |    15
 PAID-PARTIAL         |    16
 DECLINED             |    17
 DISTRIBUTED          |    18
 REPORT_PUBLISHED     |    19
 EXPORT_LINKED        |    20
